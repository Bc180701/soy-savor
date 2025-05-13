import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserContactInfo } from "@/services/profileService";
import { checkPostalCodeDelivery } from "@/services/deliveryService";
import { CartStep } from "@/components/cart/CartStep";
import { DeliveryStep } from "@/components/cart/DeliveryStep";
import { PaymentStep } from "@/components/cart/PaymentStep";
import { CheckoutSteps, CheckoutStep } from "@/components/cart/CheckoutSteps";
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

const Panier = () => {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const TAX_RATE = 0.1; // 10% TVA
  const DELIVERY_FEE = 3.5; // 3.50€ frais de livraison

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.Cart);
  const [loading, setLoading] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
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
  const [loadingUserProfile, setLoadingUserProfile] = useState<boolean>(false);
  
  // Check if user is logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      
      // If user is logged in, prefetch their contact information
      if (data.session) {
        setUserEmail(data.session.user.email);
        fetchUserContactInfo();
      }
    };
    
    checkLoginStatus();
  }, []);
  
  // Fetch user contact information if logged in
  const fetchUserContactInfo = async () => {
    setLoadingUserProfile(true);
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
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoadingUserProfile(false);
    }
  };
  
  const subtotal = total; // Utiliser total de useCart
  const tax = subtotal * TAX_RATE;
  const deliveryFee = deliveryInfo.orderType === "delivery" ? DELIVERY_FEE : 0;
  
  // Calculate discount if promo code is applied
  const discount = appliedPromoCode 
    ? appliedPromoCode.isPercentage 
      ? (subtotal * appliedPromoCode.discount / 100)
      : appliedPromoCode.discount
    : 0;
  
  // Calculate total with discount
  const orderTotal = subtotal + tax + deliveryFee - discount;

  const handleNextStep = () => {
    if (currentStep === CheckoutStep.Cart) {
      if (items.length === 0) {
        toast({
          title: "Panier vide",
          description: "Veuillez ajouter des articles à votre panier.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(CheckoutStep.DeliveryDetails);
    } else if (currentStep === CheckoutStep.DeliveryDetails) {
      if (!validateDeliveryInfo()) {
        return;
      }
      setCurrentStep(CheckoutStep.Payment);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === CheckoutStep.DeliveryDetails) {
      setCurrentStep(CheckoutStep.Cart);
    } else if (currentStep === CheckoutStep.Payment) {
      setCurrentStep(CheckoutStep.DeliveryDetails);
    }
  };

  const validateDeliveryInfo = () => {
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
  };

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

      // Validate postal code again before proceeding
      if (deliveryInfo.orderType === "delivery" && deliveryInfo.postalCode) {
        const isValidPostalCode = await checkPostalCodeDelivery(deliveryInfo.postalCode);
        if (!isValidPostalCode) {
          toast({
            title: "Code postal non desservi",
            description: `Nous ne livrons pas dans la zone ${deliveryInfo.postalCode}. Veuillez choisir un autre mode de livraison.`,
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
      
      // Appel à la fonction edge pour créer la session de paiement
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items,
          subtotal,
          tax,
          deliveryFee,
          discount: discount,
          total: orderTotal,  // Utilisation du montant total incluant la réduction
          orderType: deliveryInfo.orderType,
          clientName: deliveryInfo.name,
          clientEmail: deliveryInfo.email,
          clientPhone: deliveryInfo.phone,
          deliveryStreet: deliveryInfo.street,
          deliveryCity: deliveryInfo.city,
          deliveryPostalCode: deliveryInfo.postalCode,
          customerNotes: deliveryInfo.notes,
          scheduledFor: scheduledForDate.toISOString(),
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

  // Render the current step component
  const renderStep = () => {
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-4xl mx-auto">
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
          {renderStep()}
        </motion.div>
      </div>
    </div>
  );
};

export default Panier;
