
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useCart, useCartTotal } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserContactInfo } from "@/services/profileService";
import { checkPostalCodeDelivery, calculateDeliveryFee } from "@/services/deliveryService";
import { CartStep } from "@/components/cart/CartStep";
import { DeliveryStep } from "@/components/cart/DeliveryStep";
import { PaymentStep } from "@/components/cart/PaymentStep";
import { CheckoutSteps, CheckoutStep } from "@/components/cart/CheckoutSteps";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";
import { useCartRestaurant } from "@/hooks/useCartRestaurant";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Interface pour les informations de livraison
interface DeliveryInfo {
  orderType: "delivery" | "pickup";
  name: string;
  email: string;
  phone: string;
  street?: string;
  city?: string;
  postalCode?: string;
  pickupTime?: string;
  deliveryInstructions?: string;
  notes?: string;
  allergies: string[];
  isPostalCodeValid?: boolean;
}

const PanierContent = () => {
  const { items, clearCart, selectedRestaurantId } = useCart();
  const cartTotal = useCartTotal();
  const { toast } = useToast();
  const { cartRestaurant } = useCartRestaurant();
  const TAX_RATE = 0.1; // 10% TVA

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.Cart);
  const [loading, setLoading] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [tip, setTip] = useState<number>(0);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    orderType: "delivery",
    name: "",
    email: "",
    phone: "",
    allergies: [],
    isPostalCodeValid: undefined
  });
  
  // State for promo code
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [contactInfoLoaded, setContactInfoLoaded] = useState<boolean>(false);

  // Log du restaurant détecté et du panier - optimisé avec useMemo
  const debugInfo = useMemo(() => ({
    itemsCount: items.length,
    items: items,
    selectedRestaurantId,
    cartRestaurant: cartRestaurant?.name,
    cartTotal
  }), [items.length, selectedRestaurantId, cartRestaurant?.name, cartTotal]);

  useEffect(() => {
    console.log("🛒 État du panier:", debugInfo);
  }, [debugInfo]);
  
  // Check if user is logged in - only once
  useEffect(() => {
    let mounted = true;
    
    const checkLoginStatus = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setIsLoggedIn(!!data.session);
          
          if (data.session) {
            setUserEmail(data.session.user.email);
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    
    checkLoginStatus();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Fetch user contact information - optimisé avec useCallback stable
  const fetchUserContactInfo = useCallback(async () => {
    if (contactInfoLoaded || !isLoggedIn) return;
    
    console.log("🔍 Chargement informations contact utilisateur");
    
    try {
      const contactInfo = await getUserContactInfo();
      if (contactInfo.name || contactInfo.email || contactInfo.phone) {
        setDeliveryInfo(prev => ({
          ...prev,
          name: contactInfo.name || prev.name,
          email: contactInfo.email || prev.email,
          phone: contactInfo.phone || prev.phone
        }));
      }
      setContactInfoLoaded(true);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [contactInfoLoaded, isLoggedIn]);

  // Load contact info only when moving to delivery step - optimisé
  useEffect(() => {
    if (currentStep === CheckoutStep.DeliveryDetails && isLoggedIn && !contactInfoLoaded) {
      fetchUserContactInfo();
    }
  }, [currentStep, isLoggedIn, contactInfoLoaded, fetchUserContactInfo]);
  
  // Calculs optimisés avec useMemo
  const calculations = useMemo(() => {
    const subtotal = cartTotal;
    const tax = subtotal * TAX_RATE;
    const deliveryFee = deliveryInfo.orderType === "delivery" ? calculateDeliveryFee(subtotal) : 0;
    
    // Calculate discount if promo code is applied
    const discount = appliedPromoCode 
      ? appliedPromoCode.isPercentage 
        ? (subtotal * appliedPromoCode.discount / 100)
        : appliedPromoCode.discount
      : 0;
    
    // Calculate total with discount and tip
    const orderTotal = subtotal + tax + deliveryFee + tip - discount;

    return {
      subtotal,
      tax,
      deliveryFee,
      discount,
      orderTotal
    };
  }, [cartTotal, deliveryInfo.orderType, appliedPromoCode, tip]);

  const { subtotal, tax, deliveryFee, discount, orderTotal } = calculations;

  // Log des calculs seulement quand ils changent vraiment
  useEffect(() => {
    console.log("📊 Panier - Calculs détaillés:", {
      ...calculations,
      tip,
      itemsCount: items.length,
      itemsQuantity: items.reduce((total, item) => total + item.quantity, 0),
      restaurantId: cartRestaurant?.id,
      selectedRestaurantId
    });
  }, [calculations, tip, items.length, cartRestaurant?.id, selectedRestaurantId]);

  const handleNextStep = useCallback(() => {
    console.log("🔄 handleNextStep appelé - Step:", currentStep, "Items:", items.length);
    
    if (currentStep === CheckoutStep.Cart) {
      if (items.length === 0) {
        console.error("❌ Panier vide détecté");
        toast({
          title: "Panier vide",
          description: "Veuillez ajouter des articles à votre panier.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("✅ Panier valide, passage à l'étape livraison");
      setCurrentStep(CheckoutStep.DeliveryDetails);
    } else if (currentStep === CheckoutStep.DeliveryDetails) {
      if (!validateDeliveryInfo()) {
        return;
      }
      setCurrentStep(CheckoutStep.Payment);
    }
  }, [currentStep, items.length, toast]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep === CheckoutStep.DeliveryDetails) {
      setCurrentStep(CheckoutStep.Cart);
    } else if (currentStep === CheckoutStep.Payment) {
      setCurrentStep(CheckoutStep.DeliveryDetails);
    }
  }, [currentStep]);

  const validateDeliveryInfo = useCallback(() => {
    if (!deliveryInfo.name || !deliveryInfo.email || !deliveryInfo.phone) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return false;
    }

    if (deliveryInfo.orderType === "delivery") {
      if (!deliveryInfo.street || !deliveryInfo.city || !deliveryInfo.postalCode) {
        toast({
          title: "Adresse de livraison incomplète",
          description: "Veuillez remplir tous les champs de l'adresse de livraison.",
          variant: "destructive",
        });
        return false;
      }

      // Important: Check if postal code is valid for delivery
      if (deliveryInfo.isPostalCodeValid === false) {
        toast({
          title: "Code postal non desservi",
          description: "Nous ne livrons pas dans cette zone. Veuillez choisir un autre code postal ou opter pour le retrait en magasin.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (!deliveryInfo.pickupTime) {
      toast({
        title: "Horaire manquant",
        description: `Veuillez sélectionner un horaire de ${deliveryInfo.orderType === "delivery" ? "livraison" : "retrait"}.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [deliveryInfo, toast]);

  const handleStripeCheckout = async () => {
    try {
      setLoading(true);
      
      if (!validateDeliveryInfo()) {
        setLoading(false);
        return;
      }

      // If delivery is selected and postal code is invalid, prevent proceeding
      if (deliveryInfo.orderType === "delivery" && deliveryInfo.isPostalCodeValid === false) {
        toast({
          title: "Code postal non desservi",
          description: "Nous ne livrons pas dans cette zone. Veuillez choisir un autre code postal ou opter pour le retrait en magasin.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate postal code again before proceeding - maintenant avec le restaurant du panier
      if (deliveryInfo.orderType === "delivery" && deliveryInfo.postalCode && cartRestaurant?.id) {
        const isValidPostalCode = await checkPostalCodeDelivery(deliveryInfo.postalCode, cartRestaurant.id);
        if (!isValidPostalCode) {
          toast({
            title: "Code postal non desservi",
            description: `Nous ne livrons pas dans la zone ${deliveryInfo.postalCode} pour ${cartRestaurant.name}. Veuillez choisir un autre mode de livraison.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Préparation des données pour la fonction edge
      const scheduledForDate = new Date();
      const [hours, minutes] = deliveryInfo.pickupTime?.split(':') || ["12", "00"];
      scheduledForDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      // Appel à la fonction edge pour créer la session de paiement - avec restaurant ID
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items,
          subtotal,
          tax,
          deliveryFee,
          tip,
          discount: discount,
          promoCode: appliedPromoCode?.code,
          total: orderTotal,
          orderType: deliveryInfo.orderType,
          clientName: deliveryInfo.name,
          clientEmail: deliveryInfo.email,
          clientPhone: deliveryInfo.phone,
          deliveryStreet: deliveryInfo.street,
          deliveryCity: deliveryInfo.city,
          deliveryPostalCode: deliveryInfo.postalCode,
          customerNotes: deliveryInfo.notes,
          scheduledFor: scheduledForDate.toISOString(),
          restaurantId: cartRestaurant?.id, // Ajout du restaurant ID
          successUrl: `${window.location.origin}/commande-confirmee`,
          cancelUrl: `${window.location.origin}/panier`,
        },
      });

      if (error) {
        console.error("Erreur lors de la création de la session Stripe:", error);
        toast({
          title: "Erreur de paiement",
          description: "Une erreur est survenue lors de l'initialisation du paiement.",
          variant: "destructive",
        });
        return;
      }

      // Rediriger vers la page de paiement Stripe
      window.location.href = data.url;
      
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du paiement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatage de la date du jour
  const formattedCurrentDay = format(new Date(), "EEEE", { locale: fr });

  // Render the current step component - optimisé avec useMemo
  const stepComponent = useMemo(() => {
    switch (currentStep) {
      case CheckoutStep.Cart:
        return (
          <CartStep
            items={items}
            subtotal={subtotal}
            tax={tax}
            discount={discount}
            appliedPromoCode={appliedPromoCode}
            setAppliedPromoCode={setAppliedPromoCode}
            handleNextStep={handleNextStep}
            userEmail={userEmail}
          />
        );
      case CheckoutStep.DeliveryDetails:
        return (
          <DeliveryStep
            deliveryInfo={deliveryInfo}
            setDeliveryInfo={setDeliveryInfo}
            allergies={allergies}
            setAllergies={setAllergies}
            handlePreviousStep={handlePreviousStep}
            handleNextStep={handleNextStep}
            isLoggedIn={isLoggedIn}
            cartRestaurant={cartRestaurant} // Passer le restaurant détecté
          />
        );
      case CheckoutStep.Payment:
        return (
          <PaymentStep
            items={items}
            subtotal={subtotal}
            tax={tax}
            deliveryFee={deliveryFee}
            discount={discount}
            appliedPromoCode={appliedPromoCode}
            deliveryInfo={deliveryInfo}
            loading={loading}
            handlePreviousStep={handlePreviousStep}
            handleStripeCheckout={handleStripeCheckout}
            tip={tip}
            setTip={setTip}
          />
        );
      default:
        return null;
    }
  }, [
    currentStep,
    items,
    subtotal,
    tax,
    discount,
    appliedPromoCode,
    deliveryInfo,
    allergies,
    handleNextStep,
    handlePreviousStep,
    userEmail,
    isLoggedIn,
    cartRestaurant,
    deliveryFee,
    loading,
    handleStripeCheckout,
    tip
  ]);

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Affichage du restaurant détecté */}
        {cartRestaurant && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Restaurant sélectionné :</span> {cartRestaurant.name}
            </p>
          </div>
        )}
        
        {/* Étapes du checkout */}
        <CheckoutSteps currentStep={currentStep} />
        
        {/* Contenu de l'étape actuelle */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {stepComponent}
        </motion.div>
      </div>
    </div>
  );
};

const Panier = () => {
  return (
    <RestaurantProvider>
      <PanierContent />
    </RestaurantProvider>
  );
};

export default Panier;
