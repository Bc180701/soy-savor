import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useOrder } from "@/hooks/use-order";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";
import DeliveryMethod from "@/components/checkout/DeliveryMethod";
import DeliveryAddressForm, { DeliveryAddressData } from "@/components/checkout/DeliveryAddressForm";
import TimeSlotSelector from "@/components/checkout/TimeSlotSelector";

// Enum for checkout steps
enum CheckoutStep {
  CART = 'cart',
  DELIVERY_METHOD = 'delivery-method',
  DELIVERY_ADDRESS = 'delivery-address',
  TIME_SLOT = 'time-slot',
  PAYMENT = 'payment',
}

const Panier = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const cart = useCart();
  const orderStore = useOrder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.CART);
  
  // Order details
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("pickup");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressData | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string>("");

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const handleIncrement = (id: string) => {
    cart.incrementQuantity(id);
  };

  const handleDecrement = (id: string) => {
    cart.decrementQuantity(id);
  };

  const handleRemove = (id: string) => {
    cart.removeItem(id);
    toast({
      title: "Article supprimé",
      description: "L'article a été retiré de votre panier",
    });
  };

  const handleDeliveryMethodChange = (method: "delivery" | "pickup", fee: number) => {
    setOrderType(method);
    setDeliveryFee(fee);
  };

  const handleAddressSubmit = (data: DeliveryAddressData) => {
    setDeliveryAddress(data);
    setCurrentStep(CheckoutStep.TIME_SLOT);
  };

  const handleTimeSlotSelect = (time: string) => {
    setDeliveryTime(time);
    setCurrentStep(CheckoutStep.PAYMENT);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour passer une commande",
      });
      // Rediriger vers la page de connexion
      navigate("/login", { state: { returnUrl: "/panier" } });
      return;
    }
    
    // Calculate scheduled time
    const orderDate = new Date();
    const [hours, minutes] = deliveryTime.split(':').map(Number);
    orderDate.setHours(hours, minutes, 0, 0);
    
    // Créer la commande dans la base de données
    const result = await createOrder({
      items: cart.items,
      subtotal: cart.total,
      tax: cart.total * 0.1, // 10% de TVA
      deliveryFee: deliveryFee,
      total: cart.total + deliveryFee + (cart.total * 0.1),
      orderType: orderType,
      paymentMethod: "credit-card", // Par défaut
      deliveryInstructions: deliveryAddress?.instructions || undefined,
      scheduledFor: orderDate,
      clientName: deliveryAddress?.name,
      clientPhone: deliveryAddress?.phone,
      clientEmail: deliveryAddress?.email,
      deliveryStreet: deliveryAddress?.street,
      deliveryCity: deliveryAddress?.city,
      deliveryPostalCode: deliveryAddress?.postalCode
    });
    
    if (result.success) {
      // Enregistrer les informations de commande dans le stockage local
      const order = {
        items: cart.items,
        total: cart.total + deliveryFee + (cart.total * 0.1),
        date: new Date().toISOString()
      };
      
      orderStore.createOrder(order);
      
      // Vider le panier
      cart.clearCart();
      
      setIsProcessing(false);
      
      toast({
        title: "Commande validée !",
        description: "Votre commande a été enregistrée avec succès",
      });
      
      // Rediriger vers la page de compte
      navigate("/compte");
    } else {
      setIsProcessing(false);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.error || "Une erreur est survenue lors du traitement de votre commande",
      });
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.total;
    const tax = subtotal * 0.1; // 10% TVA
    return subtotal + tax + deliveryFee;
  };

  const goToNextStep = () => {
    if (currentStep === CheckoutStep.CART) {
      setCurrentStep(CheckoutStep.DELIVERY_METHOD);
    } else if (currentStep === CheckoutStep.DELIVERY_METHOD) {
      if (orderType === "delivery") {
        setCurrentStep(CheckoutStep.DELIVERY_ADDRESS);
      } else {
        setCurrentStep(CheckoutStep.TIME_SLOT);
      }
    } else if (currentStep === CheckoutStep.TIME_SLOT) {
      setCurrentStep(CheckoutStep.PAYMENT);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === CheckoutStep.DELIVERY_METHOD) {
      setCurrentStep(CheckoutStep.CART);
    } else if (currentStep === CheckoutStep.DELIVERY_ADDRESS) {
      setCurrentStep(CheckoutStep.DELIVERY_METHOD);
    } else if (currentStep === CheckoutStep.TIME_SLOT) {
      if (orderType === "delivery") {
        setCurrentStep(CheckoutStep.DELIVERY_ADDRESS);
      } else {
        setCurrentStep(CheckoutStep.DELIVERY_METHOD);
      }
    } else if (currentStep === CheckoutStep.PAYMENT) {
      setCurrentStep(CheckoutStep.TIME_SLOT);
    }
  };

  useEffect(() => {
    if (orderType === "pickup") {
      setDeliveryAddress(null);
    }
  }, [orderType]);

  const isNextButtonDisabled = () => {
    if (currentStep === CheckoutStep.CART) {
      return cart.items.length === 0;
    }
    if (currentStep === CheckoutStep.TIME_SLOT) {
      return !deliveryTime;
    }
    return false;
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Votre Panier</h1>
        <p className="text-gray-600 text-center mb-12">
          Vérifiez vos articles et procédez au paiement
        </p>

        {cart.items.length === 0 && currentStep === CheckoutStep.CART ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <ShoppingBag className="h-12 w-12 text-gray-300" />
                <h2 className="text-2xl font-semibold">Votre panier est vide</h2>
                <p className="text-gray-600 mb-6">
                  Vous n'avez pas encore ajouté d'articles à votre panier
                </p>
                <Button asChild className="bg-gold-600 hover:bg-gold-700">
                  <Link to="/commander">
                    Découvrir notre menu
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {currentStep === CheckoutStep.CART && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Articles ({cart.items.length})</h2>
                  <Card>
                    <CardContent className="p-0">
                      <ul className="divide-y divide-gray-100">
                        {cart.items.map((item) => (
                          <li key={item.menuItem.id} className="py-6 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                                <img
                                  src={item.menuItem.imageUrl || '/placeholder.svg'}
                                  alt={item.menuItem.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium">{item.menuItem.name}</h3>
                                <p className="text-gold-600 font-semibold mt-1">
                                  {item.menuItem.price.toFixed(2)} €
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDecrement(item.menuItem.id)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleIncrement(item.menuItem.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-500 hover:text-red-500"
                                onClick={() => handleRemove(item.menuItem.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {currentStep === CheckoutStep.DELIVERY_METHOD && (
                <DeliveryMethod 
                  subtotal={cart.total}
                  onMethodChange={handleDeliveryMethodChange}
                />
              )}
              
              {currentStep === CheckoutStep.DELIVERY_ADDRESS && (
                <DeliveryAddressForm
                  onComplete={handleAddressSubmit}
                  onCancel={() => setCurrentStep(CheckoutStep.DELIVERY_METHOD)}
                />
              )}
              
              {currentStep === CheckoutStep.TIME_SLOT && (
                <TimeSlotSelector
                  onSelect={handleTimeSlotSelect}
                  orderType={orderType}
                />
              )}
              
              {currentStep === CheckoutStep.PAYMENT && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Récapitulatif de la commande</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium">Articles</h4>
                      <ul className="mt-2 space-y-2">
                        {cart.items.map((item) => (
                          <li key={item.menuItem.id} className="flex justify-between">
                            <span>{item.quantity} x {item.menuItem.name}</span>
                            <span>{(item.menuItem.price * item.quantity).toFixed(2)} €</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium">Mode de réception</h4>
                      <p className="mt-1">{orderType === "delivery" ? "Livraison à domicile" : "Retrait en magasin"}</p>
                      {orderType === "delivery" && deliveryAddress && (
                        <div className="mt-2">
                          <p className="font-medium">Adresse de livraison:</p>
                          <p>{deliveryAddress.name}</p>
                          <p>{deliveryAddress.street}</p>
                          <p>{deliveryAddress.postalCode} {deliveryAddress.city}</p>
                          <p>Tél: {deliveryAddress.phone}</p>
                          <p>Email: {deliveryAddress.email}</p>
                          {deliveryAddress.instructions && (
                            <p className="mt-1 text-sm italic">Instructions: {deliveryAddress.instructions}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium">Horaire</h4>
                      <p className="mt-1">
                        {orderType === "delivery" ? 
                          deliveryTime === "Offerts" ? 
                            "Livraison prévue à " : 
                            `Livraison prévue à ${deliveryTime}` : 
                          "Retrait prévu à " + deliveryTime}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium">Paiement</h4>
                      <p className="mt-1">Carte bancaire</p>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep !== CheckoutStep.CART && (
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </Button>
                  
                  {currentStep === CheckoutStep.PAYMENT ? (
                    <Button 
                      className="bg-gold-600 hover:bg-gold-700"
                      onClick={handleCheckout}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Traitement en cours..." : "Payer maintenant"}
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNextStep}
                      disabled={isNextButtonDisabled()}
                      className="bg-gold-600 hover:bg-gold-700"
                    >
                      Continuer <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{cart.total.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (10%)</span>
                      <span>{(cart.total * 0.1).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span>
                        {orderType === "delivery" ? 
                          deliveryFee === 0 ? 
                            "Offerts" : 
                            `${deliveryFee.toFixed(2)} €` : 
                          "—"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{calculateTotal().toFixed(2)} €</span>
                    </div>
                  </div>
                </CardContent>
                {currentStep === CheckoutStep.CART && (
                  <CardFooter>
                    <Button 
                      className="w-full bg-gold-600 hover:bg-gold-700"
                      onClick={goToNextStep}
                      disabled={cart.items.length === 0}
                    >
                      Passer commande
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Panier;
