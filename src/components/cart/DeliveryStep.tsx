import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { User, Mail, Phone, MapPin, Clock, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [hasPrefilledOnce, setHasPrefilledOnce] = useState(false);
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

  // Gérer le pré-remplissage des informations (seulement quand la case est cochée)
  const handleUseStoredInfoChange = (checked: boolean) => {
    console.log("📋 Changement case à cocher:", checked, "Profil disponible:", !!userProfile);
    setUseStoredInfo(checked);
    
    if (checked && userProfile && !hasPrefilledOnce) {
      console.log("✅ Pré-remplissage avec profil:", userProfile);
      console.log("✅ Pré-remplissage avec adresse:", userAddress);
      
      const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
      
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

      setHasPrefilledOnce(true);
      
      toast({
        title: "Informations pré-remplies",
        description: "Vos informations enregistrées ont été chargées",
      });
    } else if (!checked) {
      console.log("❌ Décoché - vidage des champs");
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
      
      setHasPrefilledOnce(false);
      
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeSelection = (time: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      pickupTime: time
    }));
  };

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

  const handleAddressCancel = () => {
    // Do nothing, just return to the current state
  };

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

  const isContinueButtonDisabled = () => {
    // Pour la livraison, vérifier que le code postal est valide
    if (deliveryInfo.orderType === "delivery") {
      return deliveryInfo.isPostalCodeValid !== true;
    }
    
    // Pour le retrait, pas de restriction liée au code postal
    return false;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Informations de livraison</h2>
        <p className="text-gray-600">Renseignez vos coordonnées pour finaliser votre commande</p>
      </div>
      
      {/* Restaurant Card */}
      {cartRestaurant && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Commande pour : {cartRestaurant.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Delivery Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold-600" />
            Mode de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryMethod 
            defaultValue={deliveryInfo.orderType} 
            onChange={handleOrderTypeChange} 
          />
        </CardContent>
      </Card>
      
      {/* Stored Info Checkbox */}
      {isLoggedIn && !loadingProfile && userProfile && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="use-stored-info"
                checked={useStoredInfo}
                onCheckedChange={handleUseStoredInfoChange}
              />
              <Label htmlFor="use-stored-info" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Utiliser mes informations enregistrées
                </span>
                <span className="text-sm text-blue-600">
                  ({userProfile.email})
                </span>
              </Label>
            </div>
          </CardContent>
        </Card>
      )}
      
      {loadingProfile && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Chargement des informations utilisateur...</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-gold-600" />
            Informations de contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet *
              </Label>
              <Input
                id="name"
                name="name"
                value={deliveryInfo.name}
                onChange={handleChange}
                placeholder="Votre nom"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={deliveryInfo.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone *
              </Label>
              <Input
                id="phone"
                name="phone"
                value={deliveryInfo.phone}
                onChange={handleChange}
                placeholder="06 XX XX XX XX"
                required
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Address Information (only for delivery) */}
      {deliveryInfo.orderType === "delivery" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-600" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryAddressForm
              onComplete={handleAddressComplete}
              onCancel={handleAddressCancel}
              cartRestaurant={cartRestaurant}
              initialData={{
                name: deliveryInfo.name,
                email: deliveryInfo.email,
                phone: deliveryInfo.phone,
                street: deliveryInfo.street,
                city: deliveryInfo.city,
                postalCode: deliveryInfo.postalCode,
                deliveryInstructions: deliveryInfo.deliveryInstructions
              }}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Pickup/Delivery Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-600" />
            Horaire de {deliveryInfo.orderType === "delivery" ? "livraison" : "retrait"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSlotSelector
            orderType={deliveryInfo.orderType}
            onSelect={handleTimeSelection}
            selectedTime={deliveryInfo.pickupTime}
            cartRestaurant={cartRestaurant}
          />
        </CardContent>
      </Card>
      
      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold-600" />
            Instructions spéciales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            value={deliveryInfo.notes || ""}
            onChange={handleChange}
            placeholder="Instructions spéciales pour votre commande..."
            className="h-24 resize-none"
          />
        </CardContent>
      </Card>
      
      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Allergies et intolérances
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button 
          onClick={handlePreviousStep}
          variant="outline"
          className="px-6 py-3"
        >
          Retour au panier
        </Button>
        <Button 
          onClick={handleContinueToPayment}
          className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-3 font-medium"
          disabled={isContinueButtonDisabled()}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Continuer au paiement
        </Button>
      </div>
    </div>
  );
};
