
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkPostalCodeDelivery, getDeliveryLocations, getCitiesForPostalCode } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Restaurant } from "@/types/restaurant";

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
  cartRestaurant?: Restaurant | null;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    deliveryInstructions?: string;
  };
}

// Postal codes with excluded cities - show warning message
const EXCLUDED_CITIES_BY_CP: Record<string, { excluded: string[]; message: string }> = {
  "13520": {
    excluded: ["Les Baux-de-Provence", "Les Baux de Provence", "Baux-de-Provence", "Baux de Provence"],
    message: "Nous ne livrons plus aux Baux-de-Provence"
  }
};

const DeliveryAddressForm = ({ onComplete, onCancel, cartRestaurant, initialData }: DeliveryAddressFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    street: initialData?.street || "",
    city: initialData?.city || "",
    postalCode: initialData?.postalCode || "",
    instructions: initialData?.deliveryInstructions || ""
  });
  
  const [isValidatingPostalCode, setIsValidatingPostalCode] = useState(false);
  const [isPostalCodeValid, setIsPostalCodeValid] = useState<boolean | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<{city: string, postalCode: string}[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [matchingCities, setMatchingCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      const shouldSync = !formData.name && !formData.email && !formData.phone && !formData.street && !formData.city && !formData.postalCode;
      
      if (shouldSync) {
        setFormData({
          name: initialData.name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          street: initialData.street || "",
          city: initialData.city || "",
          postalCode: initialData.postalCode || "",
          instructions: initialData.deliveryInstructions || ""
        });
        setIsPostalCodeValid(null);
      }
    }
  }, [initialData]);

  useEffect(() => {
    const loadDeliveryZones = async () => {
      if (!cartRestaurant?.id) {
        setDeliveryZones([]);
        setIsPostalCodeValid(null);
        return;
      }
      
      setLoadingZones(true);
      try {
        const zones = await getDeliveryLocations(cartRestaurant.id);
        setDeliveryZones(zones);
        setIsPostalCodeValid(null);
      } catch (error) {
        console.error("Erreur chargement zones:", error);
        setDeliveryZones([]);
        setIsPostalCodeValid(null);
      } finally {
        setLoadingZones(false);
      }
    };

    loadDeliveryZones();
  }, [cartRestaurant?.id]);

  // Lookup cities when postal code changes (5 digits)
  useEffect(() => {
    const lookupCities = async () => {
      const cp = formData.postalCode.trim();
      if (cp.length !== 5 || !cartRestaurant?.id) {
        setMatchingCities([]);
        return;
      }

      setLoadingCities(true);
      try {
        const cities = await getCitiesForPostalCode(cp, cartRestaurant.id);
        setMatchingCities(cities);
        
        // Auto-select if only one city
        if (cities.length === 1) {
          setFormData(prev => ({ ...prev, city: cities[0] }));
        } else if (cities.length > 1) {
          // Reset city if current selection is not in the list
          if (!cities.includes(formData.city)) {
            setFormData(prev => ({ ...prev, city: "" }));
          }
        }
      } catch {
        setMatchingCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    lookupCities();
  }, [formData.postalCode, cartRestaurant?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "postalCode") {
      setIsPostalCodeValid(null);
    }
  };

  const validateAndConfirmPostalCode = async () => {
    if (!formData.postalCode.trim()) {
      setIsPostalCodeValid(false);
      return;
    }

    if (!cartRestaurant?.id) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant détecté dans le panier",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.postalCode) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPostalCode(true);
    
    try {
      const isValid = await checkPostalCodeDelivery(formData.postalCode.trim(), cartRestaurant.id);
      setIsPostalCodeValid(isValid);
      
      if (!isValid) {
        toast({
          title: "Code postal non desservi",
          description: `Le code postal ${formData.postalCode} n'est pas dans notre zone de livraison pour ${cartRestaurant.name}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Zone de livraison confirmée",
          description: `Nous livrons bien au code postal ${formData.postalCode} depuis ${cartRestaurant.name}.`,
        });
        
        onComplete({
          ...formData,
          isPostalCodeValid: true
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

  const refreshDeliveryZones = async () => {
    if (!cartRestaurant?.id) return;
    
    setLoadingZones(true);
    try {
      const zones = await getDeliveryLocations(cartRestaurant.id);
      setDeliveryZones(zones);
      setIsPostalCodeValid(null);
      
      toast({
        title: "Zones actualisées",
        description: `Zones de livraison mises à jour pour ${cartRestaurant.name}`,
      });
    } catch (error) {
      console.error("Erreur actualisation zones:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les zones de livraison",
        variant: "destructive",
      });
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const excludedInfo = EXCLUDED_CITIES_BY_CP[formData.postalCode.trim()];
  const showCityDropdown = matchingCities.length > 1;

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Adresse de livraison</h3>
        {cartRestaurant && (
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              Restaurant: <span className="font-medium">{cartRestaurant.name}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshDeliveryZones}
              disabled={loadingZones}
            >
              <RefreshCw className={`h-4 w-4 ${loadingZones ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {loadingZones ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Chargement des zones de livraison pour {cartRestaurant?.name}...</span>
          </div>
        </div>
      ) : deliveryZones.length > 0 ? (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Zones de livraison pour {cartRestaurant?.name} ({deliveryZones.length} zones) :
          </p>
          <div className="flex flex-wrap gap-2">
            {deliveryZones.map((zone, index) => (
              <span key={`${zone.city}-${zone.postalCode}-${index}`} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {zone.city} ({zone.postalCode})
              </span>
            ))}
          </div>
        </div>
      ) : cartRestaurant ? (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            Aucune zone de livraison définie pour {cartRestaurant.name}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            ID Restaurant: {cartRestaurant.id}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Aucun restaurant détecté dans le panier
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
            <Label htmlFor="postalCode">Code postal *</Label>
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="13160"
              required
              className={getPostalCodeInputClass()}
            />
          </div>
          <div>
            <Label htmlFor="city">Ville *</Label>
            {showCityDropdown ? (
              <Select
                value={formData.city}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, city: value }));
                  setIsPostalCodeValid(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre ville" />
                </SelectTrigger>
                <SelectContent>
                  {matchingCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Votre ville"
                required
              />
            )}
            {loadingCities && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Recherche des villes...
              </p>
            )}
          </div>
        </div>

        {/* Warning for excluded cities */}
        {excludedInfo && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-800">{excludedInfo.message}</p>
          </div>
        )}

        <div>
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={validateAndConfirmPostalCode}
              disabled={isValidatingPostalCode || !formData.postalCode.trim() || !formData.name || !formData.email || !formData.phone || !formData.street || !formData.city}
              className="bg-gold-500 hover:bg-gold-600 text-white border-0 w-full"
            >
              {isValidatingPostalCode ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Vérification...</>
              ) : isPostalCodeValid === true ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Adresse validée</>
              ) : isPostalCodeValid === false ? (
                <><XCircle className="h-4 w-4 mr-2" /> Hors zone - Réessayer</>
              ) : (
                "Vérifier et confirmer l'adresse"
              )}
            </Button>
          </div>
          {isPostalCodeValid === true && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-green-800 font-medium">✓ Adresse validée et confirmée !</p>
              <p className="text-xs text-green-600">Votre adresse a été enregistrée pour cette commande.</p>
            </div>
          )}
          {isPostalCodeValid === false && (
            <p className="text-sm text-red-600 mt-1">✗ Hors zone de livraison</p>
          )}
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
        </div>
      </form>
    </div>
  );
};

export default DeliveryAddressForm;
