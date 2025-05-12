import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Plus, Minus, Trash2 } from 'lucide-react';
import { TimeSlotSelector } from '@/components/checkout/TimeSlotSelector';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { DeliveryAddressForm } from '@/components/checkout/DeliveryAddressForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { Icons } from "@/components/icons"

interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

const Panier = () => {
  const cart = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useUser();
  const [step, setStep] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | 'dinein'>('delivery');
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [address, setAddress] = useState<{ street: string; city: string; postalCode: string; } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressFormVisible, setIsAddressFormVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  useEffect(() => {
    if (paymentSuccess && orderId) {
      toast({
        title: "Paiement réussi!",
        description: "Votre commande a été validée avec succès.",
      });
      cart.clearCart();
      navigate(`/order-confirmation/${orderId}`);
    }
  }, [paymentSuccess, orderId, navigate, cart, toast]);
  
  const handleAddressSubmit = (data: { street: string; city: string; postalCode: string; }) => {
    setAddress(data);
    setIsAddressFormVisible(false);
  };
  
  const handleCreateOrder = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Vous devez être connecté",
        description: "Veuillez vous connecter pour passer commande.",
      });
      navigate('/login');
      return;
    }
    
    if (!deliveryTime) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une heure de livraison.",
      });
      return;
    }
    
    if (deliveryMethod === 'delivery' && !address) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer votre adresse de livraison.",
      });
      return;
    }
    
    setIsCreatingOrder(true);
    
    try {
      // Créer une nouvelle adresse si elle est fournie
      let delivery_address_id = null;
      if (newAddress.street && newAddress.city && newAddress.postalCode) {
        const { data: newAddressData, error: newAddressError } = await supabase
          .from('user_addresses')
          .insert([{
            user_id: user.id,
            street: newAddress.street,
            city: newAddress.city,
            postal_code: newAddress.postalCode,
          }])
          .select()
          .single();
        
        if (newAddressError) {
          throw new Error(`Erreur lors de la création de l'adresse: ${newAddressError.message}`);
        }
        delivery_address_id = newAddressData.id;
      } else if (address) {
        // Si l'adresse existe déjà, on ne la recrée pas
        const { data: existingAddress, error: existingAddressError } = await supabase
          .from('user_addresses')
          .select('id')
          .eq('user_id', user.id)
          .eq('street', address.street)
          .eq('city', address.city)
          .eq('postal_code', address.postalCode)
          .single();
        
        if (existingAddressError && existingAddressError.code !== 'PGRST116') {
          throw new Error(`Erreur lors de la récupération de l'adresse existante: ${existingAddressError.message}`);
        }
        
        if (existingAddress) {
          delivery_address_id = existingAddress.id;
        } else {
          // Si l'adresse n'existe pas, on la crée
          const { data: newAddressData, error: newAddressError } = await supabase
            .from('user_addresses')
            .insert([{
              user_id: user.id,
              street: address.street,
              city: address.city,
              postal_code: address.postalCode,
            }])
            .select()
            .single();
          
          if (newAddressError) {
            throw new Error(`Erreur lors de la création de l'adresse: ${newAddressError.message}`);
          }
          delivery_address_id = newAddressData.id;
        }
      }
      
      // Créer la commande
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: cart.total,
          delivery_method: deliveryMethod,
          delivery_time: deliveryTime,
          delivery_address_id: delivery_address_id,
          status: 'pending',
        }])
        .select()
        .single();
      
      if (orderError) {
        throw new Error(`Erreur lors de la création de la commande: ${orderError.message}`);
      }
      
      const orderId = orderData.id;
      setOrderId(orderId);
      
      // Créer les items de la commande
      const cartItems = cart.items;
      for (const item of cartItems) {
        const { error: orderItemError } = await supabase
          .from('order_items')
          .insert([{
            order_id: orderId,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
          }]);
        
        if (orderItemError) {
          throw new Error(`Erreur lors de la création de l'item de la commande: ${orderItemError.message}`);
        }
      }
      
      toast({
        title: "Commande créée!",
        description: "Votre commande a été créée avec succès. Veuillez procéder au paiement.",
      });
      
      setStep(4);
    } catch (error: any) {
      console.error("Erreur lors de la création de la commande:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la commande.",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };
  
  // Fix the methods for cartItems
  const increaseQuantity = (item: CartItem) => {
    cart.increaseQuantity(item.id);
  };
  
  const decreaseQuantity = (item: CartItem) => {
    cart.decreaseQuantity(item.id);
  };
  
  const removeItem = (item: CartItem) => {
    cart.removeFromCart(item.id);
  };
  
  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto py-24 px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Votre panier est vide</CardTitle>
            <CardDescription className="text-center">
              Ajoutez des articles pour passer commande
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-gray-600">
              Votre panier est actuellement vide. Parcourez notre menu et ajoutez les articles que vous souhaitez commander.
            </p>
            <Button asChild>
              <Link to="/" className="text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au menu
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-24 px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Votre panier</CardTitle>
          <CardDescription className="text-center">
            Vérifiez votre commande avant de passer à la caisse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Articles dans votre panier</h2>
              <ul>
                {cart.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center">
                      <div className="w-20 h-20 mr-4">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-gray-600">{item.price} €</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => decreaseQuantity(item)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => increaseQuantity(item)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => removeItem(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total: {cart.total} €</span>
                <Button onClick={() => setStep(2)}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Suivant
                </Button>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Méthode de commande</h2>
              <div className="flex space-x-4 mb-4">
                <Button
                  variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('delivery')}
                >
                  Livraison
                </Button>
                <Button
                  variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('pickup')}
                >
                  À emporter
                </Button>
                <Button
                  variant={deliveryMethod === 'dinein' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('dinein')}
                >
                  Sur place
                </Button>
              </div>
              
              {deliveryMethod === 'delivery' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Adresse de livraison</h3>
                    <Button variant="outline" size="sm" onClick={() => setIsAddressFormVisible(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une nouvelle adresse
                    </Button>
                  </div>
                  
                  {isAddressFormVisible ? (
                    <DeliveryAddressForm onSubmit={handleAddressSubmit} />
                  ) : address ? (
                    <div className="border rounded-md p-4 bg-white">
                      <p className="font-medium">Adresse sélectionnée:</p>
                      <p>{address.street}</p>
                      <p>{address.city}, {address.postalCode}</p>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 bg-white">
                      <p className="text-gray-500">Aucune adresse sélectionnée.</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="street">Rue</Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="Votre rue"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Votre ville"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      type="text"
                      placeholder="Votre code postal"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={() => setStep(3)}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Choisissez votre heure de livraison</h2>
              <TimeSlotSelector
                selectedTime={deliveryTime}
                setSelectedTime={setDeliveryTime}
                deliveryMethod={deliveryMethod}
              />
              
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={handleCreateOrder} disabled={isCreatingOrder}>
                  {isCreatingOrder ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Création de la commande...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paiement</h2>
              <OrderSummary
                cartItems={cart.items}
                total={cart.total}
                deliveryMethod={deliveryMethod}
                address={address}
              />
              
              {deliveryMethod === 'delivery' && address && (
                <div className="mt-2">
                  <span className="font-semibold">Adresse de livraison :</span>
                  <div>{address.street}</div>
                  <div>{address.city}, {address.postalCode}</div>
                </div>
              )}
              
              {deliveryTime && (
                <div className="mt-2">
                  <span className="font-semibold">Heure :</span>{" "}
                  {format(new Date(`2000-01-01T${deliveryTime}`), "HH'h'mm", { locale: fr })}
                </div>
              )}
              
              <PaymentForm
                amount={cart.total}
                onSuccess={() => setPaymentSuccess(true)}
                orderId={orderId}
                setIsSubmitting={setIsSubmitting}
              />
              
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button disabled={true}>
                  Payer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Panier;
