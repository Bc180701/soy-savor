import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { type CartExtras } from "./CartExtrasSection";
import { User, Mail, Phone, MapPin, Clock, MessageSquare, AlertCircle, CheckCircle2, TruckIcon, Gift, CalendarDays } from "lucide-react";
import { useCartEventProducts } from "@/hooks/useCartEventProducts";
import { useCart } from "@/hooks/use-cart";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  cartExtras?: CartExtras | null;
  orderTotal: number;
  subtotal?: number;
}

export const DeliveryStep = ({
  deliveryInfo,
  setDeliveryInfo,
  allergies,
  setAllergies,
  handlePreviousStep,
  handleNextStep,
  isLoggedIn,
  cartRestaurant,
  cartExtras,
  orderTotal,
  subtotal
}: DeliveryStepProps) => {
  const [isValidatingPostalCode, setIsValidatingPostalCode] = useState(false);
  const [useStoredInfo, setUseStoredInfo] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [showFreeDeliveryDialog, setShowFreeDeliveryDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Detect event products in cart (Christmas, etc.)
  const eventInfo = useCartEventProducts(cartRestaurant?.id);
  
  // Detect if there's a product from "Box du Midi" category - restrict to morning slots only
  // Category values can vary across sources (e.g. "Box du midi", "box_du_midi", "box_du_midi_stmartin")
  const { items: cartItems } = useCart();

  const normalizeCategory = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]+/g, "_") // spaces/dashes/etc -> _
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");

  const hasBoxDuMidi = cartItems.some((item) => {
    const normalizedCategory = normalizeCategory(String(item.menuItem.category || ""));
    return normalizedCategory.includes("box_du_midi");
  });

  if (hasBoxDuMidi) {
    console.log("🍱 [DeliveryStep] Catégorie Box du Midi détectée → créneaux du matin uniquement");
  }
  
  // Auto-switch to pickup if delivery is disabled for this event
  useEffect(() => {
    if (eventInfo.hasEventProducts && !eventInfo.deliveryEnabled && deliveryInfo.orderType === "delivery") {
      console.log("🎄 Livraison désactivée pour cet événement, passage au retrait");
      setDeliveryInfo(prev => ({ ...prev, orderType: "pickup" }));
      toast({
        title: "Mode retrait uniquement",
        description: `Pour ${eventInfo.eventName}, seul le retrait en magasin est disponible.`,
      });
    }
  }, [eventInfo.hasEventProducts, eventInfo.deliveryEnabled, deliveryInfo.orderType]);

  // Calculer le sous-total sans les frais de livraison pour le popup livraison gratuite
  // Note: orderTotal inclut les frais de livraison, on doit recalculer le subtotal
  const subtotalForFreeDelivery = deliveryInfo.orderType === "delivery" ? orderTotal - 5 : orderTotal;
  
  // Pop-up pour livraison gratuite si sous-total entre 25€ et 35€
  useEffect(() => {
    const timer = setTimeout(() => {
      // Utiliser le sous-total réel (sans frais de livraison) pour le calcul
      if (subtotalForFreeDelivery >= 25 && subtotalForFreeDelivery < 35 && deliveryInfo.orderType === "delivery") {
        setShowFreeDeliveryDialog(true);
      }
    }, 3000); // 3 secondes de délai

    return () => clearTimeout(timer);
  }, [subtotalForFreeDelivery, deliveryInfo.orderType]);

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
                ...(profile as any),
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

  // Gérer le pré-remplissage des informations
  const handleUseStoredInfoChange = (checked: boolean) => {
    console.log("📋 Changement case à cocher:", checked, "Profil disponible:", !!userProfile);
    setUseStoredInfo(checked);
    
    if (checked && userProfile) {
      console.log("✅ Pré-remplissage avec profil:", userProfile);
      console.log("✅ Pré-remplissage avec adresse:", userAddress);
      
      const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
      
      // Utiliser setTimeout pour s'assurer que la mise à jour se fait après le render
      setTimeout(() => {
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

        toast({
          title: "Informations pré-remplies",
          description: "Vos informations enregistrées ont été chargées",
        });
      }, 100);
    } else if (!checked) {
      console.log("❌ Décoché - vidage des champs");
      // Vider les champs quand on décoche
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

    // Validation en temps réel pour l'email
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError("Format d'email invalide (exemple: nom@domaine.com)");
      } else {
        setEmailError("");
      }
    }
  };

  // Nouvelle fonction pour synchroniser les informations de contact vers l'adresse
  const handleContactFieldBlur = (fieldName: string, value: string) => {
    console.log("🔄 Synchronisation champ contact:", fieldName, "=", value);
    
    // Synchroniser automatiquement vers l'adresse de livraison si c'est une livraison
    if (deliveryInfo.orderType === "delivery") {
      setDeliveryInfo(prev => ({
        ...prev,
        // Synchroniser vers les champs d'adresse correspondants
        ...(fieldName === "name" && { name: value }),
        ...(fieldName === "email" && { email: value }),
        ...(fieldName === "phone" && { phone: value })
      }));
    }
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
        title: "Adresse non vérifiée",
        description: "Veuillez cliquer sur le bouton 'Vérifier' pour valider votre code postal avant de continuer.",
        variant: "destructive",
      });
      
      // Scroll vers le champ de code postal
      const postalCodeInput = document.getElementById("postalCode");
      if (postalCodeInput) {
        postalCodeInput.scrollIntoView({ behavior: "smooth", block: "center" });
        postalCodeInput.focus();
      }
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
      <>
      {/* Pop-up livraison gratuite */}
      <Dialog open={showFreeDeliveryDialog} onOpenChange={setShowFreeDeliveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TruckIcon className="w-6 h-6 text-gold-600" />
              Profitez de la livraison gratuite !
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              <div className="space-y-3">
                <p className="font-medium text-foreground">
                  Vous êtes à seulement <span className="text-gold-600 font-bold">{(35 - subtotalForFreeDelivery).toFixed(2)}€</span> de la livraison gratuite !
                </p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez encore quelques articles à votre panier pour atteindre 35€ et bénéficier de la livraison offerte.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => {
                      setShowFreeDeliveryDialog(false);
                      navigate('/commander', { 
                        state: { preselectedRestaurantId: cartRestaurant?.id } 
                      });
                    }}
                    className="flex-1"
                  >
                    Ajouter des articles
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFreeDeliveryDialog(false)}
                    className="flex-1"
                  >
                    Continuer sans
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Informations de livraison</h2>
          {isLoggedIn && userProfile && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-stored-info"
                checked={useStoredInfo}
                onCheckedChange={handleUseStoredInfoChange}
                disabled={loadingProfile}
              />
              <Label htmlFor="use-stored-info" className="text-sm cursor-pointer">
                {loadingProfile ? "Chargement..." : "Utiliser mes informations enregistrées"}
              </Label>
            </div>
          )}
        </div>

        {cartExtras && (
          <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
            <h3 className="font-semibold text-gold-800 mb-2">🍜 Vos options sélectionnées :</h3>
            <div className="space-y-1 text-sm text-gold-700">
              <p><strong>Sauces :</strong> {
                cartExtras.sauces.length > 0 
                  ? cartExtras.sauces.map(sauce => 
                      sauce.name === "Aucune" 
                        ? sauce.name 
                        : `${sauce.name}${sauce.quantity > 1 ? ` (${sauce.quantity}x)` : ''}`
                    ).join(', ')
                  : 'Aucune'
              }</p>
              <p><strong>Accompagnements :</strong> {
                cartExtras.accompagnements.length > 0 
                  ? cartExtras.accompagnements.map(accomp => accomp.name).join(', ')
                  : 'Aucun'
              }</p>
              <p><strong>Baguettes :</strong> {
                cartExtras.baguettesQuantity > 0 
                  ? `${cartExtras.baguettesQuantity} paire(s)` 
                  : 'Non demandées'
              }</p>
              <p><strong>Fourchettes :</strong> {
                cartExtras.fourchettesQuantity > 0 
                  ? `${cartExtras.fourchettesQuantity}` 
                  : 'Non demandées'
              }</p>
              <p><strong>Cuillères :</strong> {
                cartExtras.cuilleresQuantity > 0 
                  ? `${cartExtras.cuilleresQuantity}` 
                  : 'Non demandées'
              }</p>
            </div>
          </div>
        )}
      
      {/* Event Banner - Show when cart contains event products */}
      {eventInfo.hasEventProducts && eventInfo.eventDate && (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">
                  🎄 Commande spéciale {eventInfo.eventName}
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <CalendarDays className="w-3 h-3" />
                  Retrait prévu le {format(parseISO(eventInfo.eventDate), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                {!eventInfo.deliveryEnabled && (
                  <p className="text-xs text-amber-700 mt-1">
                    ⚠️ Retrait en magasin uniquement pour cet événement
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restaurant Card */}
      {cartRestaurant ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Commande pour : {cartRestaurant.name}
                </p>
                {cartRestaurant.city && (
                  <p className="text-xs text-green-600">
                    {cartRestaurant.city}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Détection du restaurant en cours...
                </p>
                <p className="text-xs text-amber-600">
                  Veuillez patienter
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
            restaurant={cartRestaurant}
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
                onBlur={(e) => handleContactFieldBlur("name", e.target.value)}
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
                onBlur={(e) => handleContactFieldBlur("email", e.target.value)}
                placeholder="votre@email.com"
                required
                className={`mt-1 ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {emailError && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {emailError}
                </div>
              )}
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
                onBlur={(e) => handleContactFieldBlur("phone", e.target.value)}
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
            {eventInfo.hasEventProducts && eventInfo.eventDate ? (
              <>
                Horaire de retrait pour le {format(parseISO(eventInfo.eventDate), "d MMMM", { locale: fr })}
              </>
            ) : (
              <>Horaire de {deliveryInfo.orderType === "delivery" ? "livraison" : "retrait"}</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSlotSelector
            orderType={deliveryInfo.orderType}
            onSelect={handleTimeSelection}
            selectedTime={deliveryInfo.pickupTime}
            cartRestaurant={cartRestaurant}
            targetDate={eventInfo.hasEventProducts ? eventInfo.eventDate ?? undefined : undefined}
            eventName={eventInfo.hasEventProducts ? eventInfo.eventName ?? undefined : undefined}
            eventTimeSlots={eventInfo.hasEventProducts ? eventInfo.eventTimeSlots : undefined}
            restrictToMorningSlots={hasBoxDuMidi}
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
      <div className="space-y-3 pt-6">
        <div className="flex justify-between">
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
        {isContinueButtonDisabled() && deliveryInfo.orderType === "delivery" && (
          <div className="text-center">
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              ⚠️ Au moins un des champs obligatoires n'est pas valide ou complet. Pensez à vérifier votre code postal.
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
