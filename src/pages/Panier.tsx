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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import * as dateFns from "date-fns";
import fr from "date-fns/locale/fr";
import { Salad, Leaf, Soup, Fish, Apple, Banana } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PaymentMethodDisplay from "@/components/checkout/PaymentMethodDisplay";

// Enum for checkout steps
enum CheckoutStep {
  CART = 'cart',
  DELIVERY_METHOD = 'delivery-method',
  DELIVERY_ADDRESS = 'delivery-address',
  TIME_SLOT = 'time-slot',
  PAYMENT = 'payment',
}

// Type pour les produits offerts
interface FreeProduct {
  id: string;
  name: string;
  icon: React.ReactNode;
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
  
  // États pour la promotion
  const [isPromotionApplicable, setIsPromotionApplicable] = useState(false);
  const [selectedFreeProduct, setSelectedFreeProduct] = useState<string | null>(null);
  
  // Liste des produits offerts
  const freeProducts: FreeProduct[] = [
    { id: "salade-chou", name: "Salade de chou", icon: <Salad className="h-5 w-5 text-green-600" /> },
    { id: "salade-wakame", name: "Salade wakame", icon: <Leaf className="h-5 w-5 text-green-700" /> },
    { id: "soupe-miso", name: "Soupe miso", icon: <Soup className="h-5 w-5 text-amber-600" /> },
    { id: "nigiri-saumon", name: "Nigiri saumon (2 pièces)", icon: <Fish className="h-5 w-5 text-blue-500" /> },
    { id: "perle-ananas", name: "Perle du Japon Ananas", icon: <Apple className="h-5 w-5 text-yellow-500" /> },
    { id: "perle-banane", name: "Perle du Japon Banane", icon: <Banana className="h-5 w-5 text-yellow-400" /> },
  ];

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);
  
  // Vérifier l'éligibilité à la promotion
  useEffect(() => {
    const checkPromotionEligibility = () => {
      // Vérifier si c'est un mardi, mercredi ou jeudi
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = dim, 1 = lun, 2 = mar, 3 = mer, 4 = jeu
      const isEligibleDay = dayOfWeek >= 2 && dayOfWeek <= 4;
      
      // Vérifier si le montant est suffisant (≥ 70€) et si c'est à emporter
      const isEligibleAmount = cart.total >= 70;
      const isEligibleOrderType = orderType === "pickup";
      
      setIsPromotionApplicable(isEligibleDay && isEligibleAmount && isEligibleOrderType);
      
      // Réinitialiser le produit gratuit si la promotion n'est plus applicable
      if (!isEligibleDay || !isEligibleAmount || !isEligibleOrderType) {
        setSelectedFreeProduct(null);
      }
    };
    
    checkPromotionEligibility();
  }, [cart.total, orderType]);

  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

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
  
  const handleFreeProductSelect = (productId: string) => {
    setSelectedFreeProduct(productId);
    toast({
      title: "Produit offert sélectionné",
      description: `Votre ${freeProducts.find(p => p.id === productId)?.name} gratuit sera ajouté à votre commande.`,
    });
  };

  const handleCheckout = async () => {
    // Vérifier si la promotion est applicable et qu'un produit gratuit est sélectionné
    if (isPromotionApplicable && !selectedFreeProduct) {
      toast({
        variant: "destructive",
        title: "Produit offert non sélectionné",
        description: "Veuillez sélectionner votre produit gratuit pour bénéficier de l'offre.",
      });
      return;
    }
    
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
    
    // Ajouter une note concernant le produit gratuit si la promotion est applicable
    let customerNotes = "";
    if (isPromotionApplicable && selectedFreeProduct) {
      const freeProductName = freeProducts.find(p => p.id === selectedFreeProduct)?.name || "";
      customerNotes = `Produit offert sélectionné: ${freeProductName}`;
    }
    
    // Créer la commande dans la base de données
    const result = await createOrder({
      items: cart.items,
      subtotal: cart.total,
      tax: cart.total * 0.1, // 10% de TVA
      deliveryFee: deliveryFee,
      total: cart.total + deliveryFee + (cart.total * 0.1),
      orderType: orderType,
      paymentMethod: "credit-card", // Toujours par carte bancaire
      deliveryInstructions: deliveryAddress?.instructions || undefined,
      scheduledFor: orderDate,
      clientName: deliveryAddress?.name,
      clientPhone: deliveryAddress?.phone,
      clientEmail: deliveryAddress?.email,
      deliveryStreet: deliveryAddress?.street,
      deliveryCity: deliveryAddress?.city,
      deliveryPostalCode: deliveryAddress?.postalCode,
      customerNotes: customerNotes || undefined
    });
    
    if (result.success) {
      try {
        // Initier le paiement Stripe
        setIsRedirectingToPayment(true);
        const paymentResult = await cart.initializeStripePayment(
          result.order.id,
          deliveryAddress?.email || session.user.email
        );
        
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Échec de l'initialisation du paiement");
        }
        
        // Enregistrer les informations de commande dans le stockage local
        const order = {
          items: cart.items,
          total: cart.total + deliveryFee + (cart.total * 0.1),
          date: new Date().toISOString()
        };
        
        orderStore.createOrder(order);
        
        // Rediriger vers la page de paiement Stripe
        window.location.href = paymentResult.redirectUrl;
        return; // Arrêter l'exécution ici car nous redirigerons
      
      } catch (error) {
        console.error("Erreur lors de l'initialisation du paiement:", error);
        
        toast({
          variant: "destructive",
          title: "Erreur de paiement",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'initialisation du paiement",
        });
        
        setIsProcessing(false);
        setIsRedirectingToPayment(false);
        return;
      }
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

  // Formatage de la date du jour
  const formattedCurrentDay = dateFns.format(new Date(), "EEEE", { locale: fr });

  const renderPaymentSection = () => {
    return (
      <div>
        <h4 className="text-lg font-medium">Paiement</h4>
        <PaymentMethodDisplay />
        <p className="mt-2 text-sm text-gray-600">Paiement sécurisé en ligne uniquement</p>
      </div>
    );
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
                                {item.specialInstructions && (
                                  <p className="text-sm text-gray-500 mt-1 italic">
                                    {item.specialInstructions}
                                  </p>
                                )}
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
                    
                    {/* Affichage de la promotion si applicable */}
                    {isPromotionApplicable && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-amber-800">Promotion spéciale</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Valable uniquement à emporter les mardis, mercredis et jeudis soirs.
                        </p>
                        <p className="text-sm font-medium text-amber-700 mt-1">
                          Dès 70€ d'achat → Un produit offert au choix :
                        </p>
                        
                        <RadioGroup 
                          value={selectedFreeProduct || ""}
                          onValueChange={handleFreeProductSelect}
                          className="mt-3 space-y-2"
                        >
                          {freeProducts.map((product) => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={product.id} id={product.id} />
                              <Label htmlFor={product.id} className="flex items-center cursor-pointer">
                                {product.icon}
                                <span className="ml-2">{product.name}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        
                        {isPromotionApplicable && !selectedFreeProduct && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertTitle>Produit gratuit non sélectionné</AlertTitle>
                            <AlertDescription>
                              Veuillez sélectionner votre produit gratuit avant de valider votre commande
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                    
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
                          `Retrait prévu à ${deliveryTime}`}
                      </p>
                    </div>
                    
                    {/* Updated Payment section with our new component */}
                    {renderPaymentSection()}
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
                    disabled={isProcessing || isRedirectingToPayment}
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </Button>
                  
                  {currentStep === CheckoutStep.PAYMENT ? (
                    <Button 
                      className="bg-gold-600 hover:bg-gold-700"
                      onClick={handleCheckout}
                      disabled={isProcessing || (isPromotionApplicable && !selectedFreeProduct) || isRedirectingToPayment}
                    >
                      {isProcessing ? 
                        "Traitement en cours..." : 
                        isRedirectingToPayment ? 
                        "Redirection vers Stripe..." : 
                        "Payer maintenant"}
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
                    
                    {/* Afficher si la promotion est applicable */}
                    {isPromotionApplicable && (
                      <div className="flex justify-between text-amber-700 font-medium">
                        <span>Promotion</span>
                        <span>
                          {selectedFreeProduct ? 
                            `1 ${freeProducts.find(p => p.id === selectedFreeProduct)?.name} offert` : 
                            "Sélectionnez votre produit offert"}
                        </span>
                      </div>
                    )}
                    
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
              
              {/* Bannière d'information sur la promotion */}
              {orderType === "pickup" && cart.total >= 50 && cart.total < 70 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    {formattedCurrentDay === "mardi" || formattedCurrentDay === "mercredi" || formattedCurrentDay === "jeudi" ? (
                      <>Plus que <strong>{(70 - cart.total).toFixed(2)}€</strong> pour bénéficier d'un produit offert!</>
                    ) : (
                      <>Cette commande sera éligible à un produit offert les mardis, mercredis et jeudis si elle atteint 70€</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Panier;
