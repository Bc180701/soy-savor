
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryMethod } from "@/components/checkout/DeliveryMethod";
import { AllergiesSelector } from "@/components/checkout/AllergiesSelector";
import { TimeSlotSelector } from "@/components/checkout/TimeSlotSelector";
import DeliveryAddressForm from "@/components/checkout/DeliveryAddressForm";
import { UserCircle, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Restaurant } from "@/types/restaurant";

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

interface DeliveryStepProps {
  deliveryInfo: DeliveryInfo;
  setDeliveryInfo: (info: DeliveryInfo | ((prev: DeliveryInfo) => DeliveryInfo)) => void;
  allergies: string[];
  setAllergies: (allergies: string[]) => void;
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
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Préparer les données initiales STABLES pour le formulaire
  const stableInitialData = {
    name: deliveryInfo.name,
    email: deliveryInfo.email,
    phone: deliveryInfo.phone,
    street: deliveryInfo.street,
    city: deliveryInfo.city,
    postalCode: deliveryInfo.postalCode,
    deliveryInstructions: deliveryInfo.deliveryInstructions
  };

  const handleAddressComplete = (addressData: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    instructions: string;
    isPostalCodeValid: boolean;
  }) => {
    setDeliveryInfo(prev => ({
      ...prev,
      name: addressData.name,
      email: addressData.email,
      phone: addressData.phone,
      street: addressData.street,
      city: addressData.city,
      postalCode: addressData.postalCode,
      deliveryInstructions: addressData.instructions,
      isPostalCodeValid: addressData.isPostalCodeValid
    }));
    setShowAddressForm(false);
  };

  const handleTimeSlotChange = (time: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      pickupTime: time
    }));
  };

  const handleAllergiesChange = (selectedAllergies: string[]) => {
    setAllergies(selectedAllergies);
    setDeliveryInfo(prev => ({
      ...prev,
      allergies: selectedAllergies
    }));
  };

  if (showAddressForm) {
    return (
      <DeliveryAddressForm
        onComplete={handleAddressComplete}
        onCancel={() => setShowAddressForm(false)}
        cartRestaurant={cartRestaurant}
        initialData={stableInitialData}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Mode de {deliveryInfo.orderType === "delivery" ? "livraison" : "retrait"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryMethod
            orderType={deliveryInfo.orderType}
            onOrderTypeChange={(type) => setDeliveryInfo(prev => ({ ...prev, orderType: type }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Informations de contact et adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryInfo.name || deliveryInfo.email || deliveryInfo.phone || deliveryInfo.street ? (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {deliveryInfo.name && (
                <p><span className="font-medium">Nom:</span> {deliveryInfo.name}</p>
              )}
              {deliveryInfo.email && (
                <p><span className="font-medium">Email:</span> {deliveryInfo.email}</p>
              )}
              {deliveryInfo.phone && (
                <p><span className="font-medium">Téléphone:</span> {deliveryInfo.phone}</p>
              )}
              {deliveryInfo.orderType === "delivery" && deliveryInfo.street && (
                <div>
                  <p className="font-medium">Adresse de livraison:</p>
                  <p>{deliveryInfo.street}</p>
                  <p>{deliveryInfo.city} {deliveryInfo.postalCode}</p>
                  {deliveryInfo.deliveryInstructions && (
                    <p className="text-sm text-gray-600">Instructions: {deliveryInfo.deliveryInstructions}</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
          
          <Button 
            onClick={() => setShowAddressForm(true)}
            className="w-full bg-gold-500 hover:bg-gold-600 text-black"
          >
            {deliveryInfo.name ? "Modifier les informations" : "Renseigner les informations"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaire de {deliveryInfo.orderType === "delivery" ? "livraison" : "retrait"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSlotSelector
            orderType={deliveryInfo.orderType}
            selectedTime={deliveryInfo.pickupTime}
            onTimeChange={handleTimeSlotChange}
            restaurant={cartRestaurant}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Allergies et intolérances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AllergiesSelector
            selectedAllergies={allergies}
            onAllergiesChange={handleAllergiesChange}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button onClick={handlePreviousStep} variant="outline">
          Retour au panier
        </Button>
        <Button 
          onClick={handleNextStep}
          className="bg-gold-500 hover:bg-gold-600 text-black"
        >
          Continuer vers le paiement
        </Button>
      </div>
    </motion.div>
  );
};
