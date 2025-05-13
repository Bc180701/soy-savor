
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AllergiesSelector } from "../checkout/AllergiesSelector";
import DeliveryMethod from "../checkout/DeliveryMethod";
import DeliveryAddressForm, { DeliveryAddressData } from "../checkout/DeliveryAddressForm";
import TimeSlotSelector from "../checkout/TimeSlotSelector";

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
  setDeliveryInfo: React.Dispatch<React.SetStateAction<DeliveryInfo>>;
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

  const handleOrderTypeChange = (type: "delivery" | "pickup") => {
    setDeliveryInfo((prev) => ({
      ...prev,
      orderType: type,
      isPostalCodeValid: type === "pickup" ? undefined : prev.isPostalCodeValid
    }));
  };

  const handleTimeSelect = (time: string) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      pickupTime: time,
    }));
  };

  const handleAddressFormComplete = (data: DeliveryAddressData) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      name: data.name,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      phone: data.phone,
      email: data.email,
      deliveryInstructions: data.instructions,
      isPostalCodeValid: true
    }));
  };

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

  return (
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
        <AllergiesSelector allergies={allergies} toggleAllergy={toggleAllergy} />
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
          disabled={deliveryInfo.orderType === "delivery" && deliveryInfo.isPostalCodeValid === false}
          className="bg-gold-500 hover:bg-gold-600 text-black"
        >
          Continuer vers le paiement <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
