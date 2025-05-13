import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatEuro } from "@/utils/formatters";
import { useToast } from "@/components/ui/use-toast";
import { CartItem } from "@/types";
import { createOrder } from "@/services/orderService";
import { X, Trash, ArrowRight, Loader2 } from "lucide-react";
import DeliveryAddressForm, { DeliveryAddressData } from "@/components/checkout/DeliveryAddressForm";
import DeliveryMethod from "@/components/checkout/DeliveryMethod";
import TimeSlotSelector from "@/components/checkout/TimeSlotSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Salad, Leaf, Soup, Fish, Apple, Banana } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserContactInfo } from "@/services/profileService";
import { checkPostalCodeDelivery } from "@/services/deliveryService";

// Enum pour les étapes du checkout
enum CheckoutStep {
  Cart,
  DeliveryDetails,
  Payment
}

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
}

const Panier = () => {
  const { items, total, removeItem, updateQuantity, clearCart } = useCart();
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
    allergies: []
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState<boolean>(false);
  
  // Check if user is logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      
      // If user is logged in, prefetch their contact information
      if (data.session) {
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
  const orderTotal = subtotal + tax + deliveryFee;
  
  // État pour gérer les allergies sélectionnées
  const allergyOptions = [
    { id: "gluten", name: "Gluten", icon: <Salad className="h-4 w-4" /> },
    { id: "crustaces", name: "Crustacés", icon: <Fish className="h-4 w-4" /> },
    { id: "eggs", name: "Œufs", icon: <Banana className="h-4 w-4" /> },
    { id: "fish", name: "Poisson", icon: <Fish className="h-4 w-4" /> },
    { id: "peanuts", name: "Arachides", icon: <Leaf className="h-4 w-4" /> },
    { id: "soy", name: "Soja", icon: <Soup className="h-4 w-4" /> },
    { id: "nuts", name: "Fruits à coque", icon: <Apple className="h-4 w-4" /> },
    { id: "sesame", name: "Sésame", icon: <Leaf className="h-4 w-4" /> },
  ];
  
  // Fonction pour basculer une allergie
  const toggleAllergy = (allergyId: string) => {
    setAllergies((prevAllergies) =>
      prevAllergies.includes(allergyId)
        ? prevAllergies.filter((id) => id !== allergyId)
        : [...prevAllergies, allergyId]
    );
    
    setDeliveryInfo((prev) => ({
      ...prev,
      allergies: allergies.includes(allergyId)
        ? prev.allergies.filter((id) => id !== allergyId)
        : [...prev.allergies, allergyId]
    }));
  };

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

  const handleOrderTypeChange = (type: "delivery" | "pickup") => {
    setDeliveryInfo((prev) => ({
      ...prev,
      orderType: type
    }));
  };

  const handleTimeSelect = (time: string) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      pickupTime: time,
    }));
  };

  // Handle address form completion - now this just stores the address data
  const handleAddressFormComplete = (data: DeliveryAddressData) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      name: data.name,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      phone: data.phone,
      email: data.email,
      deliveryInstructions: data.instructions
    }));
  };

  const renderCartItems = () => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Votre panier est vide.</p>
          <Link to="/menu" className="mt-4 inline-block text-gold-500 hover:text-gold-600">
            Parcourir le menu
          </Link>
        </div>
      );
    }

    return items.map((item) => (
      <div key={`${item.menuItem.id}-${item.specialInstructions}`} className="flex items-center border-b py-4">
        {item.menuItem.imageUrl && (
          <img
            src={item.menuItem.imageUrl}
            alt={item.menuItem.name}
            className="w-16 h-16 object-cover rounded mr-4"
          />
        )}
        <div className="flex-1">
          <h3 className="font-medium">{item.menuItem.name}</h3>
          {item.specialInstructions && (
            <p className="text-sm text-gray-500">{item.specialInstructions}</p>
          )}
          <div className="flex items-center mt-2">
            <button
              className="w-6 h-6 flex items-center justify-center border rounded-full"
              onClick={() => updateQuantity(item.menuItem.id, Math.max(1, item.quantity - 1))}
            >
              -
            </button>
            <span className="mx-2">{item.quantity}</span>
            <button
              className="w-6 h-6 flex items-center justify-center border rounded-full"
              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatEuro(item.menuItem.price * item.quantity)}</p>
          <button
            className="text-red-500 hover:text-red-700 text-sm mt-1"
            onClick={() => removeItem(item.menuItem.id)}
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
    ));
  };

  const renderCartStep = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Votre Panier</h2>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          {renderCartItems()}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span>Sous-total</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>TVA (10%)</span>
            <span>{formatEuro(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-4">
            <span>Total</span>
            <span>{formatEuro(subtotal + tax)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <Link to="/menu" className="text-gray-500 hover:text-gray-700 flex items-center">
          <X className="mr-2 h-4 w-4" /> Continuer les achats
        </Link>
        <Button onClick={handleNextStep} disabled={items.length === 0} className="bg-gold-500 hover:bg-gold-600 text-black">
          Commander <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderDeliveryStep = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Informations de livraison</h2>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-6">
        {/* Mode de livraison */}
        <DeliveryMethod
          defaultValue={deliveryInfo.orderType}
          onChange={handleOrderTypeChange}
        />
        
        {/* Use DeliveryAddressForm component for delivery */}
        {deliveryInfo.orderType === "delivery" ? (
          <DeliveryAddressForm 
            onComplete={handleAddressFormComplete}
            onCancel={() => handleOrderTypeChange("pickup")}
          />
        ) : (
          // Informations personnelles for pickup
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vos coordonnées</h3>
            
            {isLoggedIn && (
              <div className="bg-gold-50 border border-gold-200 p-3 rounded-md mb-4">
                <p className="text-sm">
                  Vous êtes connecté. Vos informations de profil ont été automatiquement remplies.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={deliveryInfo.name}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Votre nom et prénom"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={deliveryInfo.phone}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Votre numéro de téléphone"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={deliveryInfo.email}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Votre adresse email"
                required
              />
            </div>
          </div>
        )}
        
        {/* Heure de livraison/retrait */}
        <TimeSlotSelector 
          orderType={deliveryInfo.orderType}
          onSelect={handleTimeSelect}
          selectedTime={deliveryInfo.pickupTime}
        />
        
        {/* Notes complémentaires */}
        <div>
          <Label htmlFor="notes">Notes supplémentaires (facultatif)</Label>
          <Textarea
            id="notes"
            value={deliveryInfo.notes || ""}
            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Autres informations à nous communiquer..."
            rows={3}
          />
        </div>
        
        {/* Allergies */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Allergies</h3>
          <p className="text-sm text-gray-500">Veuillez sélectionner vos allergies éventuelles.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {allergyOptions.map((allergy) => (
              <div
                key={allergy.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  allergies.includes(allergy.id)
                    ? "border-gold-500 bg-gold-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => toggleAllergy(allergy.id)}
              >
                <div className="flex items-center space-x-2">
                  <div className="text-gray-500">{allergy.icon}</div>
                  <span className="text-sm">{allergy.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePreviousStep}
          className="text-gray-500 hover:text-gray-700"
        >
          Retour au panier
        </Button>
        <Button
          onClick={handleNextStep}
          className="bg-gold-500 hover:bg-gold-600 text-black"
          disabled={
            // Pour le formulaire de retrait
            (deliveryInfo.orderType === "pickup" && (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.email || !deliveryInfo.pickupTime)) ||
            // Pour le formulaire de livraison - tous les champs requis doivent être remplis
            (deliveryInfo.orderType === "delivery" && (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.email || 
             !deliveryInfo.street || !deliveryInfo.city || !deliveryInfo.postalCode || !deliveryInfo.pickupTime))
          }
        >
          Continuer vers le paiement <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Récapitulatif de commande</h2>
      
      {/* Récapitulatif */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Récapitulatif des articles */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Articles</h3>
          {items.map((item) => (
            <div key={`${item.menuItem.id}-${item.specialInstructions}`} className="flex justify-between py-2 border-b">
              <div>
                <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
                {item.specialInstructions && (
                  <p className="text-sm text-gray-500">{item.specialInstructions}</p>
                )}
              </div>
              <span>{formatEuro(item.menuItem.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        
        {/* Informations de livraison */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Livraison</h3>
          <p className="mb-1">
            <span className="font-medium">Méthode :</span>{" "}
            {deliveryInfo.orderType === "delivery" ? "Livraison à domicile" : "Retrait en magasin"}
          </p>
          {deliveryInfo.orderType === "delivery" && (
            <p className="mb-1">
              <span className="font-medium">Adresse :</span>{" "}
              {deliveryInfo.street}, {deliveryInfo.postalCode} {deliveryInfo.city}
            </p>
          )}
          <p>
            <span className="font-medium">Horaire :</span>{" "}
            {deliveryInfo.pickupTime} aujourd'hui
          </p>
        </div>
        
        {/* Informations de contact */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Contact</h3>
          <p className="mb-1">
            <span className="font-medium">Nom :</span> {deliveryInfo.name}
          </p>
          <p className="mb-1">
            <span className="font-medium">Téléphone :</span> {deliveryInfo.phone}
          </p>
          <p>
            <span className="font-medium">Email :</span> {deliveryInfo.email}
          </p>
        </div>
        
        {/* Notes et allergies */}
        {(deliveryInfo.notes || allergies.length > 0) && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Informations complémentaires</h3>
            {deliveryInfo.notes && (
              <p className="mb-1">
                <span className="font-medium">Notes :</span> {deliveryInfo.notes}
              </p>
            )}
            {allergies.length > 0 && (
              <p>
                <span className="font-medium">Allergies :</span>{" "}
                {allergies.map((id) => allergyOptions.find((a) => a.id === id)?.name).join(", ")}
              </p>
            )}
          </div>
        )}
        
        {/* Récapitulatif des coûts */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between mb-2">
            <span>Sous-total</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>TVA (10%)</span>
            <span>{formatEuro(tax)}</span>
          </div>
          {deliveryInfo.orderType === "delivery" && (
            <div className="flex justify-between mb-2">
              <span>Frais de livraison</span>
              <span>{formatEuro(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg mt-4">
            <span>Total</span>
            <span>{formatEuro(orderTotal)}</span>
          </div>
        </div>
      </div>
      
      {/* Options de paiement */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Méthode de paiement</h3>
        <RadioGroup defaultValue="card" className="space-y-3">
          <div className="flex items-center space-x-3 border p-3 rounded-md">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card">Carte Bancaire</Label>
          </div>
        </RadioGroup>
        <p className="mt-4 text-sm text-gray-500">
          Vous pouvez commander en tant qu'invité sans avoir à créer de compte.
        </p>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePreviousStep}
          className="text-gray-500 hover:text-gray-700"
        >
          Modifier les informations
        </Button>
        <Button
          onClick={handleStripeCheckout}
          disabled={loading}
          className="bg-gold-500 hover:bg-gold-600 text-black"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement en cours...
            </>
          ) : (
            <>Procéder au paiement</>
          )}
        </Button>
      </div>
    </div>
  );

  // Fonction qui retourne le bon composant basé sur l'étape actuelle
  const renderStep = () => {
    switch (currentStep) {
      case CheckoutStep.Cart:
        return renderCartStep();
      case CheckoutStep.DeliveryDetails:
        return renderDeliveryStep();
      case CheckoutStep.Payment:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  // Formatage de la date du jour
  const formattedCurrentDay = format(new Date(), "EEEE", { locale: fr });

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Étapes du checkout */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`flex items-center ${currentStep >= CheckoutStep.Cart ? "text-gold-500" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= CheckoutStep.Cart ? "border-gold-500" : "border-gray-300"}`}>
                1
              </div>
              <span className="ml-2 font-medium">Panier</span>
            </div>
            <div className={`w-12 h-1 mx-2 ${currentStep >= CheckoutStep.DeliveryDetails ? "bg-gold-500" : "bg-gray-300"}`}></div>
            <div className={`flex items-center ${currentStep >= CheckoutStep.DeliveryDetails ? "text-gold-500" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= CheckoutStep.DeliveryDetails ? "border-gold-500" : "border-gray-300"}`}>
                2
              </div>
              <span className="ml-2 font-medium">Livraison</span>
            </div>
            <div className={`w-12 h-1 mx-2 ${currentStep >= CheckoutStep.Payment ? "bg-gold-500" : "bg-gray-300"}`}></div>
            <div className={`flex items-center ${currentStep >= CheckoutStep.Payment ? "text-gold-500" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= CheckoutStep.Payment ? "border-gold-500" : "border-gray-300"}`}>
                3
              </div>
              <span className="ml-2 font-medium">Paiement</span>
            </div>
          </div>
        </div>
        
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
