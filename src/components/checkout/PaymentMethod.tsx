
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const PaymentMethod = () => {
  return (
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
  );
};
