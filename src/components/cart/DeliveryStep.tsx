
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DeliveryMethod from "../checkout/DeliveryMethod";
import DeliveryAddressForm from "../checkout/DeliveryAddressForm";
import TimeSlotSelector from "../checkout/TimeSlotSelector";
import { AllergiesSelector } from "../checkout/AllergiesSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { checkPostalCodeDelivery } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";

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
}

export const DeliveryStep = ({
  deliveryInfo,
  setDeliveryInfo,
  allergies,
  setAllergies,
  handlePreviousStep,
  handleNextStep,
  isLoggedIn
}: DeliveryStepProps) => {
  const [isValidatingPostalCode, setIsValidatingPostalCode] = useState(false);
  const { toast } = useToast();

  // Validate postal code when it changes
  useEffect(() => {
    const validatePostalCode = async () => {
      if (
        deliveryInfo.orderType === "delivery" &&
        deliveryInfo.postalCode &&
        deliveryInfo.postalCode.length >= 5
      ) {
        setIsValidatingPostalCode(true);
        try {
          const isValid = await checkPostalCodeDelivery(deliveryInfo.postalCode);
          setDeliveryInfo(prev => ({
            ...prev,
            isPostalCodeValid: isValid
          }));
        } catch (error) {
          console.error("Error validating postal code:", error);
        } finally {
          setIsValidatingPostalCode(false);
        }
      }
    };

    validatePostalCode();
  }, [deliveryInfo.postalCode, deliveryInfo.orderType]);

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
      isPostalCodeValid: true // Si le formulaire se valide, le code postal est valide
    }));
  };

  // Function to handle cancellation from DeliveryAddressForm
  const handleAddressCancel = () => {
    // Do nothing, just return to the current state
  };

  // Fonction pour valider avant de passer à l'étape suivante
  const handleContinueToPayment = () => {
    // Vérifier si c'est une livraison et si le code postal est invalide
    if (deliveryInfo.orderType === "delivery" && deliveryInfo.isPostalCodeValid === false) {
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Informations de livraison</h2>
      
      {/* Delivery Method */}
      <DeliveryMethod 
        defaultValue={deliveryInfo.orderType} 
        onChange={handleOrderTypeChange} 
      />
      
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
            />
          </div>
        </div>
      </div>
      
      {/* Address Information (only for delivery) */}
      {deliveryInfo.orderType === "delivery" && (
        <DeliveryAddressForm
          onComplete={handleAddressComplete}
          onCancel={handleAddressCancel}
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
          disabled={
            deliveryInfo.orderType === "delivery" && 
            deliveryInfo.isPostalCodeValid === false
          }
        >
          Continuer au paiement
        </Button>
      </div>
    </div>
  );
};
