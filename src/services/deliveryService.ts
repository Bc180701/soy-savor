
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
