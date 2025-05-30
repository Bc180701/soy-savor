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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [postalCodeValidationStatus, setPostalCodeValidationStatus] = useState<'valid' | 'invalid' | 'pending' | null>(null);

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

  // Watch all the required fields to check if form is complete
  const watchedFields = form.watch();
  
  // Auto-submit when form is complete and valid
  useEffect(() => {
    const validateAndSubmit = async () => {
      if (isSubmitted || isValidating) return;
      
      const { name, street, city, postalCode, phone, email } = watchedFields;
      
      // Check if all required fields have values and are valid
      const allFieldsFilled = 
        name && name.length >= 2 && 
        street && street.length >= 5 && 
        city && city.length >= 2 && 
        postalCode && postalCode.length >= 5 && 
        phone && phone.length >= 10 && 
        email && email.includes('@');
      
      const hasErrors = Object.keys(form.formState.errors).length > 0;
      
      // Ne pas soumettre si le code postal est invalide
      if (allFieldsFilled && !hasErrors && !isValidating && postalCodeValidationStatus === 'valid') {
        const data = form.getValues();
        await validatePostalCodeAndSubmit(data);
      }
    };
    
    // Debounce the validation
    const timer = setTimeout(validateAndSubmit, 1000);
    return () => clearTimeout(timer);
  }, [watchedFields, form.formState.errors, isSubmitted, isValidating, postalCodeValidationStatus]);

  // Watch the postal code field to validate it whenever it changes
  const postalCode = form.watch("postalCode");
  
  // Validate postal code whenever it changes - removed length restriction and isValidating check
  useEffect(() => {
    const validatePostalCode = async () => {
      console.log("Postal code changed:", postalCode);
      
      // Reset validation status when postal code changes
      if (!postalCode || postalCode.length < 5) {
        console.log("Postal code too short, clearing validation status");
        setPostalCodeValidationStatus(null);
        form.clearErrors("postalCode");
        return;
      }
      
      if (postalCode.length === 5) {
        console.log("Starting postal code validation for:", postalCode);
        setPostalCodeValidationStatus('pending');
        
        try {
          const isValid = await checkPostalCodeDelivery(postalCode);
          console.log("Postal code validation result:", isValid);
          
          if (!isValid) {
            setPostalCodeValidationStatus('invalid');
            form.setError("postalCode", {
              type: "manual",
              message: "Code postal hors zone de livraison"
            });
            toast({
              variant: "destructive",
              title: "Zone non desservie",
              description: `Nous ne livrons pas dans la zone ${postalCode}. Veuillez choisir un autre code postal ou opter pour le retrait en magasin.`,
            });
          } else {
            setPostalCodeValidationStatus('valid');
            form.clearErrors("postalCode");
          }
        } catch (error) {
          console.error("Error validating postal code:", error);
          setPostalCodeValidationStatus('invalid');
          form.setError("postalCode", {
            type: "manual",
            message: "Erreur lors de la validation du code postal"
          });
        }
      }
    };
    
    // Debounce the validation but trigger it immediately on change
    const timer = setTimeout(validatePostalCode, 300);
    
    return () => clearTimeout(timer);
  }, [postalCode, form, toast]); // Removed isValidating dependency

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
        
        // Récupérer les informations de profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (profileError) {
          console.error("Erreur lors du chargement du profil:", profileError);
          return;
        }
        
        // Récupérer l'adresse par défaut
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
      
      // Récupérer les informations de profil
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
        // Récupérer l'email depuis la session
        const userEmail = session.user.email || "";
        
        // Construire le nom complet
        const fullName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim();
        
        form.setValue("name", fullName);
        form.setValue("phone", profileData.phone || "");
        form.setValue("email", userEmail);
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
      
      // Récupérer l'adresse par défaut
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
        // Reset postal code validation when setting from profile
        setPostalCodeValidationStatus(null);
        form.setValue("postalCode", addressData.postal_code);
        if (addressData.additional_info) {
          form.setValue("instructions", addressData.additional_info);
        }
        
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
      // Réinitialiser le formulaire pour les champs de contact uniquement
      form.setValue("name", "");
      form.setValue("phone", "");
      form.setValue("email", "");
    }
  };

  const handleProfileAddressToggle = async (checked: boolean) => {
    setUseProfileAddress(checked);
    
    if (checked) {
      await loadUserAddress();
    } else {
      // Réinitialiser le formulaire pour les champs d'adresse uniquement
      form.setValue("street", "");
      form.setValue("city", "");
      // Reset validation status when clearing postal code
      setPostalCodeValidationStatus(null);
      form.setValue("postalCode", "");
      form.setValue("instructions", "");
    }
  };

  const validatePostalCodeAndSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isSubmitted || isValidating) return;
    
    setIsValidating(true);
    
    try {
      // Vérifier une dernière fois le code postal avant soumission
      const isValidPostalCode = await checkPostalCodeDelivery(data.postalCode);
      
      if (!isValidPostalCode) {
        toast({
          variant: "destructive",
          title: "Zone non desservie",
          description: `Nous ne livrons pas dans la zone ${data.postalCode}. Veuillez choisir un autre code postal ou opter pour le retrait en magasin.`,
        });
        
        setPostalCodeValidationStatus('invalid');
        form.setError("postalCode", {
          type: "manual",
          message: "Code postal hors zone de livraison"
        });
        
        setIsValidating(false);
        return;
      }
      
      // Si valide, marquer comme soumis et continuer
      setIsSubmitted(true);
      onComplete(data);
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Adresse de livraison</h3>
        <p className="text-sm text-gray-500 mt-1">
          Veuillez entrer l'adresse où vous souhaitez recevoir votre commande
        </p>
      </div>

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
                  <Input placeholder="Jean Dupont" {...field} />
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
                  <Input placeholder="123 rue de Paris" {...field} />
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
                    <Input placeholder="Paris" {...field} />
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
                      <Input placeholder="75000" {...field} />
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
                    <Input placeholder="06 12 34 56 78" {...field} />
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
                    <Input placeholder="exemple@email.com" type="email" {...field} />
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
          </div>
        </form>
      </Form>
      {isValidating && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Validation en cours...</span>
        </div>
      )}
    </div>
  );
};

export default DeliveryAddressForm;
