import { useState, useEffect } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
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
import { type CartExtras } from "@/components/cart/CartExtrasSection";
import { useCartRestaurant } from "@/hooks/useCartRestaurant";
import { useCartEventProducts } from "@/hooks/useCartEventProducts";
import { useEventFreeDesserts } from "@/hooks/useEventFreeDesserts";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  // Scroll automatique en haut de la page au chargement
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array means this runs once on mount
  const { items, clearCart, selectedRestaurantId } = useCart();
  const cartTotal = useCartTotal();
  const { toast } = useToast();
  const { cartRestaurant, isLoading: cartRestaurantLoading, refetchRestaurant, hasItems } = useCartRestaurant();
  const TAX_RATE = 0.1; // 10% TVA
  
  // Detect event products (Christmas, etc.) in the cart
  const eventInfo = useCartEventProducts(cartRestaurant?.id);
  
  // Hook pour les desserts offerts événement
  const { calculateDessertDiscount, freeDessertsEnabled } = useEventFreeDesserts(cartRestaurant?.id);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.Cart);
  const [unavailableError, setUnavailableError] = useState<{ title: string; message: string; target?: 'cart' | 'delivery' | null } | null>(null);
  
  // Scroll automatique en haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);
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
  
  // Cart extras state
  const [cartExtras, setCartExtras] = useState<CartExtras | null>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [loadingUserProfile, setLoadingUserProfile] = useState<boolean>(false);

  // Log du restaurant détecté et du panier
  useEffect(() => {
    console.log("🛒 État du panier:", {
      itemsCount: items.length,
      items: items,
      selectedRestaurantId,
      cartRestaurant: cartRestaurant?.name,
      cartTotal,
      cartRestaurantLoading,
      hasItems
    });
  }, [items, selectedRestaurantId, cartRestaurant, cartTotal, cartRestaurantLoading, hasItems]);
  
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
  
  // Les prix sont déjà TTC, calculer la TVA incluse pour affichage
  const subtotal = cartTotal;

  // Calculate discount if promo code is applied
  const discount = appliedPromoCode 
    ? appliedPromoCode.isPercentage 
      ? (subtotal * appliedPromoCode.discount / 100)
      : appliedPromoCode.discount
    : 0;

  // Calculer la réduction des desserts offerts par l'événement
  const eventDessertDiscount = calculateDessertDiscount(items);

  // Sous-total NET (après réductions) — base pour la livraison gratuite
  const subtotalAfterDiscount = Math.max(0, subtotal - discount - eventDessertDiscount);
  const deliveryFee = deliveryInfo.orderType === "delivery" ? calculateDeliveryFee(subtotalAfterDiscount) : 0;

  // Le total TTC (sans ajouter de TVA car déjà incluse dans les prix)
  const orderTotal = subtotal + deliveryFee + tip - discount - eventDessertDiscount;

  // TVA incluse dans le total TTC (10%) - pour affichage uniquement
  const tax = orderTotal / 1.1 * 0.1;

  console.log("📊 Panier - Calculs détaillés:", {
    subtotal,
    tax,
    deliveryFee,
    discount,
    tip,
    orderTotal,
    itemsCount: items.length,
    itemsQuantity: items.reduce((total, item) => total + item.quantity, 0),
    restaurantId: cartRestaurant?.id,
    selectedRestaurantId
  });

  const handleNextStep = () => {
    console.log("🔄 handleNextStep appelé - Step:", currentStep, "Items:", items.length, "Restaurant:", cartRestaurant?.name);
    
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

      // Vérifier que le restaurant est bien détecté
      if (hasItems && !cartRestaurant && !cartRestaurantLoading) {
        console.error("❌ Restaurant non détecté pour un panier avec des articles");
        toast({
          title: "Restaurant non détecté",
          description: "Impossible de détecter le restaurant. Tentative de rechargement...",
          variant: "destructive",
        });
        refetchRestaurant();
        return;
      }

      // Attendre que le restaurant soit chargé si nécessaire
      if (hasItems && cartRestaurantLoading) {
        console.log("⏳ Attente du chargement du restaurant...");
        toast({
          title: "Chargement en cours",
          description: "Détection du restaurant en cours, veuillez patienter...",
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(deliveryInfo.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide (exemple: nom@domaine.com).",
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

  // Journalise le résultat de chaque tentative de paiement (pour comprendre les blocages côté client)
  const logCheckoutAttempt = (outcome: string, details?: string, startedAt?: number, scheduledFor?: string) => {
    try {
      void (supabase as any).from('checkout_attempts').insert({
        restaurant_id: cartRestaurant?.id || selectedRestaurantId || null,
        client_email: deliveryInfo.email || null,
        order_type: deliveryInfo.orderType,
        scheduled_for: scheduledFor || deliveryInfo.pickupTime || null,
        outcome: outcome.slice(0, 50),
        details: details ? String(details).slice(0, 1000) : null,
        duration_ms: startedAt ? Math.round(Date.now() - startedAt) : null,
        user_agent: (navigator.userAgent || '').slice(0, 500),
      }).then(() => {});
    } catch {}
  };

  // Évite qu'un appel réseau bloqué fasse tourner le bouton indéfiniment
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
    ]);

  const showCheckoutPopup = (title: string, message: string, target: 'cart' | 'delivery' | null = null) => {
    setUnavailableError({ title, message, target });
  };

  const handleStripeCheckout = async () => {
    const startedAt = Date.now();
    let scheduledForLog: string | undefined;
    let redirecting = false;
    try {
      setLoading(true);
      
      if (!validateDeliveryInfo()) {
        logCheckoutAttempt('invalid_form', undefined, startedAt);
        setLoading(false);
        return;
      }

      // 💾 SAUVEGARDE PRÉVENTIVE DU PANIER AVANT LE CHECKOUT (non bloquante)
      const restaurantIdForBackup = cartRestaurant?.id || selectedRestaurantId;
      if (restaurantIdForBackup && restaurantIdForBackup.length >= 10) {
        try {
          void supabase
            .from('cart_backup')
            .insert({
              session_id: deliveryInfo.email || 'anonymous',
              cart_items: items as any,
              restaurant_id: restaurantIdForBackup
            })
            .then(({ error: backupError }) => {
              if (backupError) console.error("Erreur lors de la sauvegarde du panier:", backupError);
            });
        } catch (backupError) {
          console.error("Erreur critique lors de la sauvegarde:", backupError);
        }
      }

      // Date/heure choisie (date d'événement si applicable)
      const [hours, minutes] = deliveryInfo.pickupTime?.split(':') || ["12", "00"];
      let localISOString: string;
      if (eventInfo.hasEventProducts && eventInfo.eventDate) {
        localISOString = `${eventInfo.eventDate}T${hours}:${minutes}:00`;
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        localISOString = `${year}-${month}-${day}T${hours}:${minutes}:00`;
      }
      scheduledForLog = localISOString;
      console.log("📅 Heure sélectionnée pour checkout (sans conversion):", localISOString);

      // 🚨 VÉRIFICATION FINALE DU CRÉNEAU AVANT PAIEMENT
      if (deliveryInfo.orderType === 'delivery' && cartRestaurant && deliveryInfo.pickupTime) {
        try {
          const { data: verification, error } = await withTimeout(
            supabase.functions.invoke('verify-time-slot', {
              body: {
                restaurantId: cartRestaurant.id,
                orderType: deliveryInfo.orderType,
                scheduledFor: localISOString
              }
            }),
            15000
          );

          if (error || !verification?.available) {
            const msg = verification?.message || "Ce créneau de livraison n'est plus disponible. Veuillez en choisir un autre.";
            logCheckoutAttempt(error ? 'slot_check_error' : 'slot_full', error?.message || msg, startedAt, localISOString);
            showCheckoutPopup(
              "Créneau plus disponible",
              `${msg} Choisissez un autre horaire de livraison pour continuer.`,
              'delivery'
            );
            return;
          }
        } catch (error: any) {
          const isTimeout = error?.message === 'TIMEOUT';
          logCheckoutAttempt(isTimeout ? 'slot_check_timeout' : 'slot_check_exception', error?.message, startedAt, localISOString);
          showCheckoutPopup(
            isTimeout ? "Connexion trop lente" : "Erreur de vérification",
            isTimeout
              ? "La vérification du créneau prend trop de temps. Vérifiez votre connexion internet puis réessayez."
              : "Erreur lors de la vérification du créneau. Veuillez réessayer."
          );
          return;
        }
      }

      if (deliveryInfo.orderType === "delivery" && deliveryInfo.isPostalCodeValid === false) {
        logCheckoutAttempt('postal_code_invalid', deliveryInfo.postalCode, startedAt, localISOString);
        showCheckoutPopup(
          "Code postal non desservi",
          "Nous ne livrons pas dans cette zone. Choisissez un autre code postal ou optez pour le retrait au restaurant.",
          'delivery'
        );
        return;
      }

      if (deliveryInfo.orderType === "delivery" && deliveryInfo.postalCode && cartRestaurant?.id) {
        const isValidPostalCode = await checkPostalCodeDelivery(deliveryInfo.postalCode, cartRestaurant.id);
        if (!isValidPostalCode) {
          logCheckoutAttempt('postal_code_invalid', deliveryInfo.postalCode, startedAt, localISOString);
          showCheckoutPopup(
            "Code postal non desservi",
            `Nous ne livrons pas dans la zone ${deliveryInfo.postalCode} pour ${cartRestaurant.name}. Choisissez le retrait au restaurant ou une autre adresse.`,
            'delivery'
          );
          return;
        }
      }

      const finalOrderTotal = subtotal + tax + deliveryFee + tip - discount - eventDessertDiscount;
      
      let data: any;
      let error: any;
      try {
        const res = await withTimeout(
          supabase.functions.invoke('create-checkout', {
            body: {
              items,
              subtotal,
              tax,
              deliveryFee,
              tip,
              discount: discount + eventDessertDiscount,
              promoCode: appliedPromoCode?.code,
              total: finalOrderTotal,
              orderType: deliveryInfo.orderType,
              clientName: deliveryInfo.name,
              clientEmail: deliveryInfo.email,
              clientPhone: deliveryInfo.phone,
              deliveryStreet: deliveryInfo.street,
              deliveryCity: deliveryInfo.city,
              deliveryPostalCode: deliveryInfo.postalCode,
              customerNotes: deliveryInfo.notes || '',
              scheduledFor: localISOString,
              restaurantId: cartRestaurant?.id,
              cartExtras: cartExtras,
              successUrl: `${window.location.origin}/commande-confirmee`,
              cancelUrl: `${window.location.origin}/panier`,
            },
          }),
          30000
        );
        data = res.data;
        error = res.error;
      } catch (e: any) {
        const isTimeout = e?.message === 'TIMEOUT';
        logCheckoutAttempt(isTimeout ? 'checkout_timeout' : 'checkout_exception', e?.message, startedAt, localISOString);
        showCheckoutPopup(
          isTimeout ? "Connexion trop lente" : "Erreur de paiement",
          isTimeout
            ? "La page de paiement met trop de temps à s'ouvrir. Vérifiez votre connexion internet puis réessayez."
            : "Une erreur est survenue lors de l'ouverture du paiement. Veuillez réessayer."
        );
        return;
      }

      if (error) {
        console.error("Erreur lors de la création de la session Stripe:", error);
        let body: any = null;
        try {
          const ctx: any = (error as any)?.context;
          if (ctx) {
            try {
              body = await ctx.json();
            } catch {
              if (typeof ctx?.text === "function") {
                try { body = JSON.parse(await ctx.text()); } catch {}
              }
            }
          }
        } catch {}
        if (body?.unavailable_products) {
          logCheckoutAttempt('product_unavailable', body.error, startedAt, localISOString);
          showCheckoutPopup("Produit indisponible", body.error || "Un produit de votre panier n'est plus disponible.", 'cart');
        } else {
          logCheckoutAttempt('checkout_error', body?.details || body?.error || error?.message, startedAt, localISOString);
          showCheckoutPopup(
            "Erreur de paiement",
            "Le paiement n'a pas pu être ouvert. Veuillez réessayer dans un instant ; si le problème continue, contactez le restaurant."
          );
        }
        return;
      }

      if (!data?.url) {
        logCheckoutAttempt('checkout_no_url', JSON.stringify(data || {}).slice(0, 500), startedAt, localISOString);
        showCheckoutPopup("Erreur de paiement", "Le paiement n'a pas pu être ouvert. Veuillez réessayer.");
        return;
      }

      logCheckoutAttempt('redirect_stripe', data.sessionId, startedAt, localISOString);
      // Rediriger vers la page de paiement Stripe
      redirecting = true;
      window.location.href = data.url;
      return; // on garde le bouton en chargement pendant la redirection
      
    } catch (error: any) {
      console.error("Erreur:", error);
      logCheckoutAttempt('client_exception', error?.message, startedAt, scheduledForLog);
      showCheckoutPopup("Erreur", "Une erreur est survenue lors du paiement. Veuillez réessayer.");
    } finally {
      // Le bouton reste en chargement uniquement si on part vers Stripe
      if (!redirecting) setLoading(false);
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
              handleNextStep={handleNextStep}
              cartExtras={cartExtras}
              setCartExtras={setCartExtras}
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
              cartRestaurant={cartRestaurant}
              cartExtras={cartExtras}
              orderTotal={orderTotal}
              subtotal={subtotalAfterDiscount}
            />
          );
      case CheckoutStep.Payment:
        return (
          <PaymentStep
            items={items}
            subtotal={subtotal}
            tax={tax}
            deliveryFee={deliveryFee}
            discount={discount + eventDessertDiscount}
            appliedPromoCode={appliedPromoCode}
            setAppliedPromoCode={setAppliedPromoCode}
            deliveryInfo={deliveryInfo}
            loading={loading}
            handlePreviousStep={handlePreviousStep}
            handleStripeCheckout={handleStripeCheckout}
            tip={tip}
            setTip={setTip}
            eventDate={eventInfo.hasEventProducts ? eventInfo.eventDate : undefined}
            eventDessertDiscount={eventDessertDiscount}
            eventName={eventInfo.eventName}
          />
        );
      default:
        return null;
    }
  };

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
          {renderStep()}
        </motion.div>
      </div>

      {/* Pop-up produit indisponible */}
      <AlertDialog open={!!unavailableError} onOpenChange={(open) => !open && setUnavailableError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{unavailableError?.title}</AlertDialogTitle>
            <AlertDialogDescription>{unavailableError?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            {unavailableError?.target && (
              <Button
                onClick={() => {
                  const target = unavailableError?.target;
                  setUnavailableError(null);
                  setCurrentStep(target === 'delivery' ? CheckoutStep.DeliveryDetails : CheckoutStep.Cart);
                }}
              >
                {unavailableError?.target === 'delivery' ? "Changer l'horaire / l'adresse" : "Retour au panier"}
              </Button>
            )}
            <AlertDialogAction
              className={buttonVariants({ variant: "outline" })}
              onClick={() => setUnavailableError(null)}
            >
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Panier = () => {
  return <PanierContent />;
};

export default Panier;
