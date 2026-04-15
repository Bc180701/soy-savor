
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkPostalCodeDelivery, getDeliveryLocations } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
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
  cartRestaurant?: Restaurant | null; // Utiliser le restaurant du panier
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
  const { toast } = useToast();

  // Synchroniser avec les données initiales quand elles changent (seulement si les champs sont vides)
  useEffect(() => {
    if (initialData) {
      console.log("🔄 Synchronisation avec données initiales:", initialData);
      
      // Ne synchroniser que si les champs actuels sont vides pour éviter d'écraser les données validées
      const shouldSync = !formData.name && !formData.email && !formData.phone && !formData.street && !formData.city && !formData.postalCode;
      
      if (shouldSync) {
        console.log("✅ Synchronisation autorisée - champs vides");
        setFormData({
          name: initialData.name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          street: initialData.street || "",
          city: initialData.city || "",
          postalCode: initialData.postalCode || "",
          instructions: initialData.deliveryInstructions || ""
        });
        
        // Reset la validation du code postal car les données ont changé
        setIsPostalCodeValid(null);
      } else {
        console.log("❌ Synchronisation ignorée - données déjà présentes");
      }
    }
  }, [initialData]);

  // Charger les zones de livraison quand le restaurant change
  useEffect(() => {
    const loadDeliveryZones = async () => {
      console.log("🔄 Effect déclenché - Restaurant du panier:", cartRestaurant?.name, "ID:", cartRestaurant?.id);
      
      if (!cartRestaurant?.id) {
        console.log("⚠️ Pas de restaurant dans le panier, reset des zones");
        setDeliveryZones([]);
        setIsPostalCodeValid(null);
        return;
      }
      
      console.log("🚚 Chargement zones pour:", cartRestaurant.name, "ID:", cartRestaurant.id);
      setLoadingZones(true);
      
      try {
        const zones = await getDeliveryLocations(cartRestaurant.id);
        console.log("✅ Zones récupérées pour", cartRestaurant.name, ":", zones);
        setDeliveryZones(zones);
        
        // Reset la validation du code postal car les zones ont changé
        setIsPostalCodeValid(null);
        
        if (zones.length === 0) {
          console.log("⚠️ Aucune zone trouvée pour", cartRestaurant.name);
        }
        
      } catch (error) {
        console.error("❌ Erreur chargement zones pour", cartRestaurant.name, ":", error);
        setDeliveryZones([]);
        setIsPostalCodeValid(null);
      } finally {
        setLoadingZones(false);
      }
    };

    loadDeliveryZones();
  }, [cartRestaurant?.id, cartRestaurant?.name]);

  // Villes correspondant au code postal saisi
  const matchingCities = useMemo(() => {
    if (!formData.postalCode.trim() || deliveryZones.length === 0) return [];
    return deliveryZones
      .filter(z => z.postalCode === formData.postalCode.trim())
      .map(z => z.city);
  }, [formData.postalCode, deliveryZones]);

  // Villes exclues pour certains codes postaux (même CP mais hors zone)
  const excludedCities: Record<string, string[]> = {
    '13520': ['Les Baux-de-Provence', 'Baux de Provence', 'Les Baux de Provence']
  };

  const currentExcluded = excludedCities[formData.postalCode.trim()] || [];
  const hasExcludedMessage = currentExcluded.length > 0 && matchingCities.length > 0;

  // Auto-set city when only one match
  useEffect(() => {
    if (matchingCities.length === 1 && formData.city !== matchingCities[0]) {
      setFormData(prev => ({ ...prev, city: matchingCities[0] }));
    }
  }, [matchingCities]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset postal code validation when postal code changes
    if (name === "postalCode") {
      setIsPostalCodeValid(null);
      // Reset city when postal code changes if we have matching cities
      setFormData(prev => ({ ...prev, city: "", postalCode: value }));
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

    // Validation
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
      console.log("🔍 Validation CP:", formData.postalCode, "pour restaurant:", cartRestaurant.name, "ID:", cartRestaurant.id);
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
        
        // Confirmer directement l'adresse
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
      console.log("🔄 Actualisation manuelle des zones pour:", cartRestaurant.name);
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
            <Label htmlFor="city">Ville *</Label>
            {matchingCities.length > 1 ? (
              <div className="space-y-2">
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
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasExcludedMessage && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    ⚠️ Nous ne livrons plus aux Baux-de-Provence
                  </p>
                )}
              </div>
            ) : matchingCities.length === 1 ? (
              <Input
                id="city"
                name="city"
                value={matchingCities[0]}
                readOnly
                className="bg-gray-50"
              />
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
                onClick={validateAndConfirmPostalCode}
                disabled={isValidatingPostalCode || !formData.postalCode.trim() || !formData.name || !formData.email || !formData.phone || !formData.street || !formData.city}
                className="bg-gold-500 hover:bg-gold-600 text-white border-0"
                size="sm"
              >
                {isValidatingPostalCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPostalCodeValid === true ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isPostalCodeValid === false ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  "Vérifier"
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
