
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useOrder } from "@/hooks/use-order";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";
import { Salad, Leaf, Soup, Fish, Apple, Banana } from "lucide-react";
import * as dateFns from "date-fns";
import * as dateFnsLocale from "date-fns/locale";

import DeliveryMethod from "@/components/checkout/DeliveryMethod";
import DeliveryAddressForm, { DeliveryAddressData } from "@/components/checkout/DeliveryAddressForm";
import TimeSlotSelector from "@/components/checkout/TimeSlotSelector";
import SumUpCardWidget from "@/components/checkout/SumUpCardWidget";

// New components
import CartItems from "@/components/checkout/CartItems";
import CartSummary from "@/components/checkout/CartSummary";
import CheckoutLayout from "@/components/checkout/CheckoutLayout";
import CheckoutNavigation from "@/components/checkout/CheckoutNavigation";
import FreeProductSelector, { FreeProduct } from "@/components/checkout/FreeProductSelector";
import OrderSummary from "@/components/checkout/OrderSummary";

// Enum for checkout steps
enum CheckoutStep {
  CART = 'cart',
  DELIVERY_METHOD = 'delivery-method',
  DELIVERY_ADDRESS = 'delivery-address',
  TIME_SLOT = 'time-slot',
  PAYMENT = 'payment',
  EMBEDDED_PAYMENT = 'embedded-payment',
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
  
  // États pour le paiement SumUp
  const [sumupCheckoutId, setSumupCheckoutId] = useState<string | null>(null);
  const [sumupPublicKey, setSumupPublicKey] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isRedirectingToSumUp, setIsRedirectingToSumUp] = useState(false);

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

  const handlePaymentSuccess = () => {
    toast({
      title: "Paiement réussi",
      description: "Votre commande a été validée avec succès !",
      variant: "success"
    });
    
    // Enregistrer les informations de commande dans le stockage local
    const order = {
      items: cart.items,
      total: cart.total + deliveryFee + (cart.total * 0.1),
      date: new Date().toISOString()
    };
    
    orderStore.createOrder(order);
    
    // Vider le panier
    cart.clearCart();
    
    // Rediriger vers la page de confirmation
    navigate(`/compte?order=${createdOrderId}`);
  };
  
  const handlePaymentError = (error: any) => {
    console.error("Erreur de paiement SumUp:", error);
    
    toast({
      title: "Erreur de paiement",
      description: "Une erreur s'est produite lors du paiement. Veuillez réessayer.",
      variant: "destructive"
    });
    
    setIsProcessing(false);
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
      setCreatedOrderId(result.order?.id || null);
      
      try {
        // Initier le paiement SumUp
        setIsRedirectingToSumUp(true);
        const paymentResult = await cart.initiateSumUpPayment(
          result.order!.id,
          deliveryAddress?.email || session.user.email
        );
        
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Échec de l'initialisation du paiement");
        }
        
        // Stocker l'ID de checkout SumUp pour le widget intégré
        setSumupCheckoutId(paymentResult.checkoutId || null);
        setSumupPublicKey(paymentResult.publicKey || null);
        
        // Passage à l'étape de paiement intégré
        setCurrentStep(CheckoutStep.EMBEDDED_PAYMENT);
        setIsRedirectingToSumUp(false);
        setIsProcessing(false);
      
      } catch (error) {
        console.error("Erreur lors de l'initialisation du paiement:", error);
        
        toast({
          variant: "destructive",
          title: "Erreur de paiement",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'initialisation du paiement",
        });
        
        setIsProcessing(false);
        setIsRedirectingToSumUp(false);
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

  // Main content based on step
  const renderStepContent = () => {
    switch (currentStep) {
      case CheckoutStep.CART:
        return (
          <CartItems
            items={cart.items}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
          />
        );
      
      case CheckoutStep.DELIVERY_METHOD:
        return (
          <DeliveryMethod 
            subtotal={cart.total}
            onMethodChange={handleDeliveryMethodChange}
          />
        );
      
      case CheckoutStep.DELIVERY_ADDRESS:
        return (
          <DeliveryAddressForm
            onComplete={handleAddressSubmit}
            onCancel={() => setCurrentStep(CheckoutStep.DELIVERY_METHOD)}
          />
        );
      
      case CheckoutStep.TIME_SLOT:
        return (
          <TimeSlotSelector
            onSelect={handleTimeSlotSelect}
            orderType={orderType}
          />
        );
      
      case CheckoutStep.PAYMENT:
        return (
          <>
            <OrderSummary 
              items={cart.items}
              orderType={orderType}
              deliveryAddress={deliveryAddress}
              deliveryTime={deliveryTime}
              isPromotionApplicable={isPromotionApplicable}
              selectedFreeProduct={selectedFreeProduct}
              freeProducts={freeProducts}
            />
            
            {isPromotionApplicable && (
              <FreeProductSelector
                products={freeProducts}
                selectedProduct={selectedFreeProduct}
                onSelect={handleFreeProductSelect}
                isPromotionApplicable={isPromotionApplicable}
              />
            )}
          </>
        );
      
      case CheckoutStep.EMBEDDED_PAYMENT:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Paiement sécurisé</h3>
            {sumupCheckoutId && (
              <SumUpCardWidget
                checkoutId={sumupCheckoutId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(CheckoutStep.PAYMENT)}
              className="flex items-center gap-2 mt-4"
            >
              <ArrowLeft className="h-4 w-4" /> Retour au récapitulatif
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderNavigation = () => {
    if (currentStep === CheckoutStep.CART || currentStep === CheckoutStep.EMBEDDED_PAYMENT) {
      return null;
    }

    return (
      <CheckoutNavigation
        currentStep={currentStep}
        onNext={goToNextStep}
        onPrevious={goToPreviousStep}
        isNextDisabled={isNextButtonDisabled()}
        isProcessing={isProcessing}
        isRedirectingToPayment={isRedirectingToSumUp}
        isPaymentStep={currentStep === CheckoutStep.PAYMENT}
        onCheckout={handleCheckout}
        isPromotionApplicable={isPromotionApplicable}
        hasSelectedFreeProduct={!!selectedFreeProduct}
      />
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

        <CheckoutLayout cartIsEmpty={cart.items.length === 0 && currentStep === CheckoutStep.CART}>
          <div className="md:col-span-2">
            {renderStepContent()}
            {renderNavigation()}
          </div>

          <div>
            <CartSummary
              subtotal={cart.total}
              deliveryFee={deliveryFee}
              orderType={orderType}
              isPromotionApplicable={isPromotionApplicable}
              selectedFreeProduct={selectedFreeProduct}
              freeProducts={freeProducts}
              isEmpty={cart.items.length === 0}
              showCheckoutButton={currentStep === CheckoutStep.CART}
              onCheckout={goToNextStep}
            />
          </div>
        </CheckoutLayout>
      </motion.div>
    </div>
  );
};

export default Panier;
