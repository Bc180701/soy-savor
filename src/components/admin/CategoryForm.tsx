
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

// Schéma de validation pour le formulaire de catégorie
const categoryFormSchema = z.object({
  id: z.string().min(1, {
    message: "L'identifiant de la catégorie est obligatoire",
  }),
  name: z.string().min(1, {
    message: "Le nom de la catégorie est obligatoire",
  }),
  description: z.string().optional(),
  display_order: z.coerce.number().int().min(0, {
    message: "L'ordre d'affichage doit être un nombre entier positif",
  }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: any;
  categories: any[];
  onSave: (updatedCategories: any[]) => void;
  onCancel: () => void;
}

const CategoryForm = ({ category, categories, onSave, onCancel }: CategoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  
  // Déterminer l'ordre d'affichage pour une nouvelle catégorie
  const getNextDisplayOrder = () => {
    if (categories.length === 0) return 0;
    return Math.max(...categories.map((c) => c.display_order)) + 1;
  };

  const defaultValues: Partial<CategoryFormValues> = {
    id: category?.id || "",
    name: category?.name || "",
    description: category?.description || "",
    display_order: category?.display_order || getNextDisplayOrder(),
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  // Désactiver la modification de l'ID pour les catégories existantes
  const isIdEditable = !category;

  const onSubmit = async (data: CategoryFormValues) => {
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (category) {
        // Vérifier si l'ID existe déjà (pour les nouvelles catégories)
        if (category.id !== data.id) {
          const { data: existingCategory } = await supabase
            .from("categories")
            .select("id")
            .eq("id", data.id)
            .eq("restaurant_id", currentRestaurant.id)
            .single();

          if (existingCategory) {
            form.setError("id", {
              type: "manual",
              message: "Cet identifiant de catégorie est déjà utilisé",
            });
            setIsSubmitting(false);
            return;
          }
        }

        // Mise à jour d'une catégorie existante
        const { error } = await supabase
          .from("categories")
          .update({
            name: data.name,
            description: data.description,
            display_order: data.display_order,
          } as any)
          .eq("id", category.id)
          .eq("restaurant_id", currentRestaurant.id);

        if (error) throw error;
      } else {
        // Vérifier si l'ID existe déjà
        const { data: existingCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("id", data.id)
          .eq("restaurant_id", currentRestaurant.id)
          .single();

        if (existingCategory) {
          form.setError("id", {
            type: "manual",
            message: "Cet identifiant de catégorie est déjà utilisé",
          });
          setIsSubmitting(false);
          return;
        }

        // Ajout d'une nouvelle catégorie
        const { error } = await supabase.from("categories").insert({
          id: data.id,
          name: data.name,
          description: data.description,
          display_order: data.display_order,
          restaurant_id: currentRestaurant.id,
        } as any);

        if (error) throw error;
      }

      // Récupérer toutes les catégories mises à jour pour ce restaurant
      const { data: updatedCategories } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", currentRestaurant.id)
        .order("display_order");

      onSave(updatedCategories || []);

      toast({
        title: category ? "Catégorie mise à jour" : "Catégorie ajoutée",
        description: `${data.name} a été ${
          category ? "mise à jour" : "ajoutée"
        } avec succès`,
      });
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de la catégorie:", error);
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Une erreur est survenue lors de l'enregistrement de la catégorie",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identifiant*</FormLabel>
              <FormControl>
                <Input
                  placeholder="ID unique de la catégorie"
                  {...field}
                  disabled={!isIdEditable}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom*</FormLabel>
              <FormControl>
                <Input placeholder="Nom de la catégorie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description de la catégorie"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="display_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre d'affichage*</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Enregistrement..."
              : category
              ? "Mettre à jour"
              : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
