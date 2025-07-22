
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { getUserProfile, saveUserProfile } from "@/services/profileService";

const profileFormSchema = z.object({
  firstName: z.string().min(1, {
    message: "Le prénom est requis",
  }),
  lastName: z.string().min(1, {
    message: "Le nom est requis",
  }),
  phone: z.string().min(10, {
    message: "Le numéro de téléphone doit contenir au moins 10 caractères",
  }),
  street: z.string().min(5, {
    message: "L'adresse doit contenir au moins 5 caractères",
  }),
  city: z.string().min(1, {
    message: "La ville est requise",
  }),
  postalCode: z.string().min(5, {
    message: "Le code postal doit contenir au moins 5 caractères",
  }),
  additionalInfo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onProfileUpdated?: () => void;
}

export default function ProfileForm({ onProfileUpdated }: ProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      street: "",
      city: "",
      postalCode: "",
      additionalInfo: "",
    },
  });

  useEffect(() => {
    // Ne charger les données qu'une seule fois au montage du composant
    const loadUserProfile = async () => {
      if (initialDataLoaded) return; // Éviter les rechargements multiples
      
      setLoading(true);
      try {
        const { profile, address, error } = await getUserProfile();
        
        if (error && error !== "Utilisateur non connecté") {
          console.error("Erreur lors du chargement du profil:", error);
          return;
        }

        // Mettre à jour le formulaire avec les données récupérées seulement si pas encore fait
        if (profile || address) {
          console.log("🔄 Chargement initial des données du profil");
          
          if (profile) {
            form.setValue("firstName", profile.first_name || "", { shouldValidate: false });
            form.setValue("lastName", profile.last_name || "", { shouldValidate: false });
            form.setValue("phone", profile.phone || "", { shouldValidate: false });
          }

          if (address) {
            form.setValue("street", address.street || "", { shouldValidate: false });
            form.setValue("city", address.city || "", { shouldValidate: false });
            form.setValue("postalCode", address.postal_code || "", { shouldValidate: false });
            form.setValue("additionalInfo", address.additional_info || "", { shouldValidate: false });
          }
          
          setInitialDataLoaded(true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []); // Dépendances vides - ne s'exécute qu'au montage

  async function onSubmit(data: ProfileFormValues) {
    setSaving(true);
    try {
      // S'assurer que toutes les données requises sont présentes
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        additionalInfo: data.additionalInfo || ""
      };
      
      const { success, error } = await saveUserProfile(profileData);
      
      if (!success) {
        console.error("Erreur lors de l'enregistrement du profil:", error);
        return;
      }

      console.log("✅ Profil sauvegardé avec succès");
      
      // Notifier que le profil a été mis à jour
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des données:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium">Informations personnelles</h3>
          <p className="text-sm text-muted-foreground">
            Ces informations seront utilisées pour vos commandes et communications.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium">Adresse de livraison</h3>
          <p className="text-sm text-muted-foreground">
            Cette adresse sera proposée lors de vos commandes en livraison.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="123 rue du Commerce" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Input placeholder="75000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informations complémentaires (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Étage, code d'entrée, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="bg-gold-500 hover:bg-gold-600 text-black">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </form>
    </Form>
  );
}
