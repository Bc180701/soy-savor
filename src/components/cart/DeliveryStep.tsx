
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DeliveryMethod from "../checkout/DeliveryMethod";
import DeliveryAddressForm from "../checkout/DeliveryAddressForm";
import TimeSlotSelector from "../checkout/TimeSlotSelector";
import { AllergiesSelector } from "../checkout/AllergiesSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { checkPostalCodeDelivery } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "@/types/restaurant";

interface DeliveryStepProps {
  deliveryInfo: {
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
  };
  setDeliveryInfo: React.Dispatch<React.SetStateAction<any>>;
  allergies: string[];
  setAllergies: React.Dispatch<React.SetStateAction<string[]>>;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
  isLoggedIn: boolean;
  cartRestaurant?: Restaurant | null;
}

export const DeliveryStep = ({
  deliveryInfo,
  setDeliveryInfo,
  allergies,
  setAllergies,
  handlePreviousStep,
  handleNextStep,
  isLoggedIn,
  cartRestaurant
}: DeliveryStepProps) => {
  const [isValidatingPostalCode, setIsValidatingPostalCode] = useState(false);
  const [useStoredInfo, setUseStoredInfo] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { toast } = useToast();

  // Charger le profil utilisateur si connecté
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isLoggedIn) {
        setLoadingProfile(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          console.log("👤 Utilisateur connecté:", user?.email);
          
          if (user) {
            // Récupérer le profil depuis la table profiles
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            
            // Récupérer l'adresse par défaut
            const { data: address, error: addressError } = await supabase
              .from('user_addresses')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_default', true)
              .maybeSingle();
            
            console.log("👤 Profil utilisateur récupéré:", { profile, profileError });
            console.log("🏠 Adresse utilisateur récupérée:", { address, addressError });
            
            if (profile) {
              setUserProfile({
                ...profile,
                email: user.email
              });
            } else if (!profileError) {
              setUserProfile({
                email: user.email,
                first_name: '',
                last_name: '',
                phone: ''
              });
            }

            if (address) {
              setUserAddress(address);
            }
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement du profil:", error);
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    
    loadUserProfile();
  }, [isLoggedIn]);

  // Gérer le pré-remplissage des informations
  const handleUseStoredInfoChange = (checked: boolean) => {
    console.log("📋 Changement case à cocher:", checked, "Profil disponible:", !!userProfile);
    setUseStoredInfo(checked);
    
    if (checked && userProfile) {
      console.log("✅ Pré-remplissage avec profil:", userProfile);
      console.log("✅ Pré-remplissage avec adresse:", userAddress);
      
      const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
      
      // Utiliser setTimeout pour s'assurer que la mise à jour se fait après le render
      setTimeout(() => {
        setDeliveryInfo(prev => {
          const newInfo = {
            ...prev,
            name: fullName || prev.name,
            email: userProfile.email || prev.email,
            phone: userProfile.phone || prev.phone,
          };

          // Si on a une adresse et que c'est une livraison, pré-remplir l'adresse aussi
          if (userAddress && prev.orderType === "delivery") {
            newInfo.street = userAddress.street || prev.street;
            newInfo.city = userAddress.city || prev.city;
            newInfo.postalCode = userAddress.postal_code || prev.postalCode;
            newInfo.deliveryInstructions = userAddress.additional_info || prev.deliveryInstructions;
          }

          console.log("📋 Nouvelles informations de livraison:", newInfo);
          return newInfo;
        });

        toast({
          title: "Informations pré-remplies",
          description: "Vos informations enregistrées ont été chargées",
        });
      }, 100);
    } else if (!checked) {
      console.log("❌ Décoché - vidage des champs");
      // Vider les champs quand on décoche
      setDeliveryInfo(prev => ({
        ...prev,
        name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        postalCode: "",
        deliveryInstructions: ""
      }));
      
      toast({
        title: "Informations réinitialisées",
        description: "Les champs ont été vidés",
      });
    }
  };

  // Handle delivery method change
  const handleOrderTypeChange = (type: "delivery" | "pickup") => {
    setDeliveryInfo(prev => ({
      ...prev,
      orderType: type
    }));
  };

  // Update delivery info
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle time slot selection
  const handleTimeSelection = (time: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      pickupTime: time
    }));
  };

  // Modified for DeliveryAddressForm
  const handleAddressComplete = (addressData: any) => {
    setDeliveryInfo(prev => ({
      ...prev,
      street: addressData.street,
      city: addressData.city,
      postalCode: addressData.postalCode,
      name: addressData.name,
      phone: addressData.phone,
      email: addressData.email,
      deliveryInstructions: addressData.instructions,
      isPostalCodeValid: addressData.isPostalCodeValid
    }));
  };

  // Function to handle cancellation from DeliveryAddressForm
  const handleAddressCancel = () => {
    // Do nothing, just return to the current state
  };

  // Fonction pour valider avant de passer à l'étape suivante
  const handleContinueToPayment = () => {
    console.log("Attempting to continue, postal code valid:", deliveryInfo.isPostalCodeValid);
    
    // Vérifier si c'est une livraison et si le code postal est invalide
    if (deliveryInfo.orderType === "delivery" && deliveryInfo.isPostalCodeValid !== true) {
      toast({
        title: "Code postal non valide",
        description: "Veuillez corriger le code postal avant de continuer. Il doit être dans notre zone de livraison (pastille verte).",
        variant: "destructive",
      });
      return;
    }

    // Vérifications habituelles
    if (!deliveryInfo.name || !deliveryInfo.email || !deliveryInfo.phone) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (deliveryInfo.orderType === "delivery") {
      if (!deliveryInfo.street || !deliveryInfo.city || !deliveryInfo.postalCode) {
        toast({
          title: "Adresse de livraison incomplète",
          description: "Veuillez remplir tous les champs de l'adresse de livraison.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!deliveryInfo.pickupTime) {
      toast({
        title: "Horaire manquant",
        description: `Veuillez sélectionner un horaire de ${deliveryInfo.orderType === "delivery" ? "livraison" : "retrait"}.`,
        variant: "destructive",
      });
      return;
    }

    // Si tout est OK, passer à l'étape suivante
    handleNextStep();
  };

  // Calculer si le bouton doit être désactivé
  const isContinueButtonDisabled = () => {
    // Pour la livraison, vérifier que le code postal est valide
    if (deliveryInfo.orderType === "delivery") {
      return deliveryInfo.isPostalCodeValid !== true;
    }
    
    // Pour le retrait, pas de restriction liée au code postal
    return false;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Informations de livraison</h2>
      
      {/* Affichage du restaurant si disponible */}
      {cartRestaurant && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <span className="font-medium">Commande pour :</span> {cartRestaurant.name}
          </p>
        </div>
      )}
      
      {/* Delivery Method */}
      <DeliveryMethod 
        defaultValue={deliveryInfo.orderType} 
        onChange={handleOrderTypeChange} 
      />
      
      {/* Case à cocher pour utiliser les informations stockées */}
      {isLoggedIn && !loadingProfile && userProfile && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md border border-blue-200">
          <Checkbox
            id="use-stored-info"
            checked={useStoredInfo}
            onCheckedChange={handleUseStoredInfoChange}
          />
          <Label htmlFor="use-stored-info" className="text-sm font-medium cursor-pointer">
            Utiliser mes informations enregistrées
          </Label>
          <span className="text-xs text-blue-600">
            ({userProfile.email})
          </span>
        </div>
      )}
      
      {loadingProfile && (
        <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement des informations utilisateur...</span>
          </div>
        </div>
      )}
      
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium">Informations de contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              name="name"
              value={deliveryInfo.name}
              onChange={handleChange}
              placeholder="Votre nom"
              required
              key={`name-${deliveryInfo.name}`}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={deliveryInfo.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              required
              key={`email-${deliveryInfo.email}`}
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              name="phone"
              value={deliveryInfo.phone}
              onChange={handleChange}
              placeholder="06 XX XX XX XX"
              required
              key={`phone-${deliveryInfo.phone}`}
            />
          </div>
        </div>
      </div>
      
      {/* Address Information (only for delivery) */}
      {deliveryInfo.orderType === "delivery" && (
        <DeliveryAddressForm
          onComplete={handleAddressComplete}
          onCancel={handleAddressCancel}
          cartRestaurant={cartRestaurant}
        />
      )}
      
      {/* Pickup/Delivery Time */}
      <TimeSlotSelector
        orderType={deliveryInfo.orderType}
        onSelect={handleTimeSelection}
        selectedTime={deliveryInfo.pickupTime}
      />
      
      {/* Special Instructions */}
      <div className="space-y-2">
        <Label htmlFor="notes">Instructions spéciales</Label>
        <Textarea
          id="notes"
          name="notes"
          value={deliveryInfo.notes || ""}
          onChange={handleChange}
          placeholder="Instructions spéciales pour votre commande..."
          className="h-24"
        />
      </div>
      
      {/* Allergies */}
      <AllergiesSelector
        allergies={allergies}
        toggleAllergy={(allergyId) => {
          if (allergies.includes(allergyId)) {
            setAllergies(allergies.filter(a => a !== allergyId));
          } else {
            setAllergies([...allergies, allergyId]);
          }
        }}
      />
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button 
          onClick={handlePreviousStep}
          variant="outline"
        >
          Retour au panier
        </Button>
        <Button 
          onClick={handleContinueToPayment}
          className="bg-gold-500 hover:bg-gold-600 text-black"
          disabled={isContinueButtonDisabled()}
        >
          Continuer au paiement
        </Button>
      </div>
    </div>
  );
};
