import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkPostalCodeDelivery, getDeliveryLocations } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface DeliveryAddressFormProps {
  onComplete: (data: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    instructions: string;
    isPostalCodeValid: boolean;
  }) => void;
  onCancel: () => void;
}

const DeliveryAddressForm = ({ onComplete, onCancel }: DeliveryAddressFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    instructions: ""
  });
  
  const [isValidatingPostalCode, setIsValidatingPostalCode] = useState(false);
  const [isPostalCodeValid, setIsPostalCodeValid] = useState<boolean | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<{city: string, postalCode: string}[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  // Load delivery zones for the current restaurant with better error handling
  useEffect(() => {
    const loadDeliveryZones = async () => {
      console.log("🏪 Restaurant actuel dans DeliveryAddressForm:", currentRestaurant?.name, currentRestaurant?.id);
      
      if (currentRestaurant?.id) {
        console.log("🚚 Début chargement zones pour:", currentRestaurant.name);
        setLoadingZones(true);
        setDeliveryZones([]); // Vider les zones pendant le chargement
        
        try {
          // Attendre un peu pour éviter les requêtes trop rapides
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const zones = await getDeliveryLocations(currentRestaurant.id);
          console.log("🌍 Zones récupérées pour", currentRestaurant.name, ":", zones.length, "zones");
          setDeliveryZones(zones);
          
          // Reset validation du code postal quand on change de restaurant
          setIsPostalCodeValid(null);
          
        } catch (error) {
          console.error("❌ Erreur chargement zones:", error);
          setDeliveryZones([]);
        } finally {
          setLoadingZones(false);
        }
      } else {
        console.log("⚠️ Aucun restaurant sélectionné, reset des zones");
        setDeliveryZones([]);
        setLoadingZones(false);
      }
    };

    loadDeliveryZones();
  }, [currentRestaurant?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset postal code validation when postal code changes
    if (name === "postalCode") {
      setIsPostalCodeValid(null);
    }
  };

  const validatePostalCode = async () => {
    if (!formData.postalCode.trim()) {
      setIsPostalCodeValid(false);
      return;
    }

    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un restaurant",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPostalCode(true);
    
    try {
      console.log("🔍 Validation CP:", formData.postalCode, "pour restaurant:", currentRestaurant.name);
      const isValid = await checkPostalCodeDelivery(formData.postalCode.trim(), currentRestaurant.id);
      setIsPostalCodeValid(isValid);
      
      if (!isValid) {
        toast({
          title: "Code postal non desservi",
          description: `Le code postal ${formData.postalCode} n'est pas dans notre zone de livraison pour ${currentRestaurant.name}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Zone de livraison confirmée",
          description: `Nous livrons bien au code postal ${formData.postalCode} depuis ${currentRestaurant.name}.`,
        });
      }
    } catch (error) {
      console.error("Error validating postal code:", error);
      setIsPostalCodeValid(false);
      toast({
        title: "Erreur de validation",
        description: "Impossible de vérifier le code postal. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPostalCode(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.postalCode) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (isPostalCodeValid !== true) {
      toast({
        title: "Code postal non validé",
        description: "Veuillez vérifier que votre code postal est dans notre zone de livraison.",
        variant: "destructive",
      });
      return;
    }

    onComplete({
      ...formData,
      isPostalCodeValid: true
    });
  };

  const getPostalCodeInputClass = () => {
    if (isPostalCodeValid === true) return "border-green-500 bg-green-50";
    if (isPostalCodeValid === false) return "border-red-500 bg-red-50";
    return "";
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Adresse de livraison</h3>
        {currentRestaurant && (
          <div className="text-sm text-gray-600">
            Restaurant: <span className="font-medium">{currentRestaurant.name}</span>
          </div>
        )}
      </div>

      {loadingZones ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Chargement des zones de livraison...</span>
          </div>
        </div>
      ) : deliveryZones.length > 0 ? (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Zones de livraison pour {currentRestaurant?.name} :
          </p>
          <div className="flex flex-wrap gap-2">
            {deliveryZones.map((zone, index) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {zone.city} ({zone.postalCode})
              </span>
            ))}
          </div>
        </div>
      ) : currentRestaurant ? (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            Aucune zone de livraison définie pour {currentRestaurant.name}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Sélectionnez un restaurant pour voir les zones de livraison
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Votre nom complet"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="votre@email.com"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="06 XX XX XX XX"
            required
          />
        </div>

        <div>
          <Label htmlFor="street">Adresse *</Label>
          <Input
            id="street"
            name="street"
            value={formData.street}
            onChange={handleInputChange}
            placeholder="Numéro et nom de rue"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ville *</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Votre ville"
              required
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Code postal *</Label>
            <div className="flex space-x-2">
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="13160"
                required
                className={getPostalCodeInputClass()}
              />
              <Button
                type="button"
                onClick={validatePostalCode}
                disabled={isValidatingPostalCode || !formData.postalCode.trim()}
                variant="outline"
                size="sm"
              >
                {isValidatingPostalCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPostalCodeValid === true ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isPostalCodeValid === false ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  "Vérifier"
                )}
              </Button>
            </div>
            {isPostalCodeValid === true && (
              <p className="text-sm text-green-600 mt-1">✓ Zone de livraison confirmée</p>
            )}
            {isPostalCodeValid === false && (
              <p className="text-sm text-red-600 mt-1">✗ Hors zone de livraison</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="instructions">Instructions de livraison</Label>
          <Textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            placeholder="Étage, code d'accès, instructions spéciales..."
            className="h-20"
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" onClick={onCancel} variant="outline">
            Annuler
          </Button>
          <Button 
            type="submit"
            className="bg-gold-500 hover:bg-gold-600 text-black"
            disabled={isPostalCodeValid !== true}
          >
            Confirmer l'adresse
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryAddressForm;
