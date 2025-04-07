
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { checkPostalCodeDelivery } from "@/services/deliveryService";
import { useToast } from "@/components/ui/use-toast";

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsValidating(true);
    
    try {
      // Check if postal code is in delivery range
      const isValidPostalCode = await checkPostalCodeDelivery(data.postalCode);
      
      if (!isValidPostalCode) {
        toast({
          variant: "destructive",
          title: "Zone non desservie",
          description: `Nous ne livrons pas dans la zone ${data.postalCode}. Veuillez choisir un autre mode de livraison.`,
        });
        setIsValidating(false);
        return;
      }
      
      // If valid, continue
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="75000" {...field} />
                  </FormControl>
                  <FormMessage />
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
            <Button 
              type="submit"
              disabled={isValidating}
              className="bg-akane-600 hover:bg-akane-700"
            >
              {isValidating ? "Validation..." : "Valider l'adresse"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DeliveryAddressForm;
