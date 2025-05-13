
import { isPostalCodeInDeliveryArea, getDeliveryLocations } from '@/integrations/supabase/client';

export interface DeliveryLocation {
  id: number;
  postal_code: string;
  city: string;
  is_active: boolean;
}

export const checkPostalCodeEligibility = async (postalCode: string): Promise<boolean> => {
  return await isPostalCodeInDeliveryArea(postalCode);
};

export const getAllDeliveryLocations = async (): Promise<DeliveryLocation[]> => {
  return await getDeliveryLocations();
};

// Adding back the missing function referenced in DeliveryAddressForm.tsx
export const checkPostalCodeDelivery = async (postalCode: string): Promise<boolean> => {
  return await isPostalCodeInDeliveryArea(postalCode);
};

// Adding back the calculateDeliveryFee function referenced in simulateOrder.ts
export const calculateDeliveryFee = (subtotal: number): number => {
  // Free delivery for orders >= 30€, otherwise 3€ delivery fee
  return subtotal >= 30 ? 0 : 3;
};
