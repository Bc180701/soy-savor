import { useState, useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { checkPostalCodeDelivery } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  street: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
  city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères" }),
  postalCode: z.string().min(5, { message: "Le code postal doit contenir 5 caractères" }),
  phone: z.string().min(10, { message: "Le numéro de téléphone doit contenir au moins 10 caractères" }),
  email: z.string().email({ message: "Format d'email invalide" }),
  instructions: z.string().optional(),
});

export type DeliveryAddressData = z.infer<typeof formSchema>;

interface DeliveryAddressFormProps {
  onComplete: (data: DeliveryAddressData) => void;
  onCancel: () => void;
}

const DeliveryAddressForm = ({ onComplete, onCancel }: DeliveryAddressFormProps) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [useProfileContact, setUseProfileContact] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [postalCodeValidationStatus, setPostalCodeValidationStatus] = useState<'valid' | 'invalid' | 'pending' | null>(null);
  const [isPrefilledData, setIsPrefilledData] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      street: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      instructions: "",
    },
  });

  const postalCodeValue = form.watch("postalCode");
  
  // Validation du code postal à chaque changement
  useEffect(() => {
    const validatePostalCode = async () => {
      console.log("Postal code field changed to:", postalCodeValue);
      
      if (!postalCodeValue || postalCodeValue.length < 5) {
        console.log("Postal code too short, clearing validation status");
        setPostalCodeValidationStatus(null);
        form.clearErrors("postalCode");
        return;
      }
      
      if (postalCodeValue.length === 5) {
        console.log("Starting postal code validation for current field value:", postalCodeValue);
        setPostalCodeValidationStatus('pending');
        
        try {
          const isValid = await checkPostalCodeDelivery(postalCodeValue);
          console.log("Postal code validation result for", postalCodeValue, ":", isValid);
          
          if (!isValid) {
            setPostalCodeValidationStatus('invalid');
            form.setError("postalCode", {
              type: "manual",
              message: "Code postal hors zone de livraison"
            });
            toast({
              variant: "destructive",
              title: "Zone non desservie",
              description: `Nous ne livrons pas dans la zone ${postalCodeValue}. Veuillez choisir un autre code postal ou opter pour le retrait en magasin.`,
            });
          } else {
            setPostalCodeValidationStatus('valid');
            form.clearErrors("postalCode");
            toast({
              title: "Code postal valide",
              description: "Ce code postal est dans notre zone de livraison.",
            });
          }
        } catch (error) {
          console.error("Error validating postal code:", error);
          setPostalCodeValidationStatus('invalid');
          form.setError("postalCode", {
            type: "manual",
            message: "Erreur lors de la validation du code postal"
          });
        }
      } else if (postalCodeValue.length > 5) {
        setPostalCodeValidationStatus('invalid');
        form.setError("postalCode", {
          type: "manual",
          message: "Le code postal doit contenir exactement 5 caractères"
        });
      }
    };
    
    const timer = setTimeout(validatePostalCode, 300);
    return () => clearTimeout(timer);
  }, [postalCodeValue, form, toast]);

  // SUPPRESSION de l'auto-submit - le formulaire ne se soumet plus automatiquement

  useEffect(() => {
    const checkUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoggedIn(false);
          return;
        }
        
        setIsLoggedIn(true);
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (profileError) {
          console.error("Erreur lors du chargement du profil:", profileError);
          return;
        }
        
        const { data: addressData, error: addressError } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_default", true)
          .single();
          
        if (addressError) {
          console.error("Erreur lors du chargement de l'adresse:", addressError);
          return;
        }
        
        if (profileData) {
          setHasProfile(true);
        }

        if (addressData) {
          setHasAddress(true);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du profil:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    checkUserProfile();
  }, []);

  const loadUserContact = async () => {
    if (!isLoggedIn) return;
    
    setIsLoadingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (profileError) {
        console.error("Erreur lors du chargement du profil:", profileError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger votre profil. Veuillez réessayer.",
        });
        return;
      }
      
      if (profileData) {
        const userEmail = session.user.email || "";
        const fullName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim();
        
        form.setValue("name", fullName);
        form.setValue("phone", profileData.phone || "");
        form.setValue("email", userEmail);
        
        // Marquer comme données pré-remplies
        setIsPrefilledData(true);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération de vos informations.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadUserAddress = async () => {
    if (!isLoggedIn) return;
    
    setIsLoadingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }
      
      const { data: addressData, error: addressError } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_default", true)
        .maybeSingle();
        
      if (addressError) {
        console.error("Erreur lors du chargement de l'adresse:", addressError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger votre adresse. Veuillez réessayer.",
        });
        return;
      }
      
      if (addressData) {
        form.setValue("street", addressData.street);
        form.setValue("city", addressData.city);
        setPostalCodeValidationStatus(null);
        form.setValue("postalCode", addressData.postal_code);
        if (addressData.additional_info) {
          form.setValue("instructions", addressData.additional_info);
        }
        
        // Marquer comme données pré-remplies
        setIsPrefilledData(true);
        
        toast({
          title: "Adresse récupérée",
          description: "Votre adresse enregistrée a été appliquée au formulaire.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Adresse introuvable",
          description: "Vous n'avez pas d'adresse enregistrée dans votre profil.",
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération de votre adresse.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileContactToggle = async (checked: boolean) => {
    setUseProfileContact(checked);
    
    if (checked) {
      await loadUserContact();
    } else {
      form.setValue("name", "");
      form.setValue("phone", "");
      form.setValue("email", "");
      setIsPrefilledData(false);
    }
  };

  const handleProfileAddressToggle = async (checked: boolean) => {
    setUseProfileAddress(checked);
    
    if (checked) {
      await loadUserAddress();
    } else {
      form.setValue("street", "");
      form.setValue("city", "");
      setPostalCodeValidationStatus(null);
      form.setValue("postalCode", "");
      form.setValue("instructions", "");
      setIsPrefilledData(false);
    }
  };

  // Fonction de validation et soumission manuelle uniquement
  const validatePostalCodeAndSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isValidating) return;
    
    const currentPostalCode = form.getValues("postalCode");
    console.log("Manual submission with current postal code:", currentPostalCode);
    
    // Vérifier le statut de validation du code postal
    if (postalCodeValidationStatus !== 'valid') {
      console.log("Cannot submit: postal code is not valid, current status:", postalCodeValidationStatus);
      toast({
        variant: "destructive",
        title: "Code postal invalide",
        description: "Veuillez entrer un code postal valide dans notre zone de livraison.",
      });
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Vérification finale du code postal
      const isValidPostalCode = await checkPostalCodeDelivery(currentPostalCode);
      
      if (!isValidPostalCode) {
        toast({
          variant: "destructive",
          title: "Zone non desservie",
          description: `Nous ne livrons pas dans la zone ${currentPostalCode}. Veuillez choisir un autre code postal ou opter pour le retrait en magasin.`,
        });
        
        setPostalCodeValidationStatus('invalid');
        form.setError("postalCode", {
          type: "manual",
          message: "Code postal hors zone de livraison"
        });
        
        setIsValidating(false);
        return;
      }
      
      console.log("Postal code validated successfully, proceeding with submission");
      
      const finalData = {
        ...data,
        postalCode: currentPostalCode
      };
      
      onComplete(finalData);
    } catch (error) {
      console.error("Error validating address:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation de votre adresse.",
      });
      setIsValidating(false);
    }
  };

  // Reset prefilled data flag when user manually changes fields
  const handleFieldChange = () => {
    if (isPrefilledData) {
      setIsPrefilledData(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Adresse de livraison</h3>
        <p className="text-sm text-gray-500 mt-1">
          Veuillez entrer l'adresse où vous souhaitez recevoir votre commande
        </p>
      </div>

      {postalCodeValidationStatus === 'invalid' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">
            ⚠️ Code postal hors zone de livraison
          </p>
          <p className="text-sm text-red-600">
            Vous ne pouvez pas continuer avec ce code postal. Veuillez en choisir un autre ou opter pour le retrait en magasin.
          </p>
        </div>
      )}

      {isLoggedIn && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="useProfileContact" 
              checked={useProfileContact}
              onCheckedChange={handleProfileContactToggle}
              disabled={isLoadingProfile || !hasProfile}
            />
            <label
              htmlFor="useProfileContact"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {hasProfile ? "Utiliser les informations de contact de mon profil" : "Complétez votre profil pour l'utiliser lors de vos commandes"}
            </label>
            {isLoadingProfile && useProfileContact && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </div>
          
          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="useProfileAddress" 
              checked={useProfileAddress}
              onCheckedChange={handleProfileAddressToggle}
              disabled={isLoadingProfile || !hasAddress}
            />
            <label
              htmlFor="useProfileAddress"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {hasAddress ? "Utiliser l'adresse de livraison de mon profil" : "Ajoutez une adresse à votre profil pour l'utiliser lors de vos commandes"}
            </label>
            {isLoadingProfile && useProfileAddress && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </div>
        </div>
      )}

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Jean Dupont" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123 rue de Paris" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Paris" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="75000" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange();
                        }}
                      />
                      {postalCodeValidationStatus === 'pending' && (
                        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {postalCodeValidationStatus === 'valid' && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 bg-green-500 rounded-full" />
                      )}
                      {postalCodeValidationStatus === 'invalid' && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 bg-red-500 rounded-full" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="06 12 34 56 78" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="exemple@email.com" 
                      type="email" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions de livraison (optionnel)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Digicode, étage, indications pour le livreur..." 
                    className="resize-none" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isValidating}
            >
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={() => {
                const data = form.getValues();
                validatePostalCodeAndSubmit(data);
              }}
              disabled={
                isValidating || 
                postalCodeValidationStatus === 'invalid' || 
                postalCodeValidationStatus === 'pending' ||
                !form.formState.isValid
              }
              className="bg-gold-500 hover:bg-gold-600 text-black"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                "Commander"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DeliveryAddressForm;
