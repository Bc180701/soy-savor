
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Schéma de validation pour le formulaire
const productFormSchema = z.object({
  name: z.string().min(1, {
    message: "Le nom du produit est obligatoire",
  }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, {
    message: "Le prix doit être un nombre positif",
  }),
  category_id: z.string().min(1, {
    message: "La catégorie est obligatoire",
  }),
  image_url: z.string().optional().nullable(),
  pieces: z.coerce.number().optional().nullable(),
  prep_time: z.coerce.number().min(0, {
    message: "Le temps de préparation doit être un nombre positif",
  }).default(10),
  is_vegetarian: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: any;
  categories: any[];
  onSave: (updatedProducts: any[]) => void;
  onCancel: () => void;
}

const ProductForm = ({ product, categories, onSave, onCancel }: ProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const defaultValues: Partial<ProductFormValues> = {
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    category_id: product?.category_id || "",
    image_url: product?.image_url || "",
    pieces: product?.pieces || null,
    prep_time: product?.prep_time || 10,
    is_vegetarian: product?.is_vegetarian || false,
    is_spicy: product?.is_spicy || false,
    is_new: product?.is_new || false,
    is_best_seller: product?.is_best_seller || false,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);

      if (product) {
        // Mise à jour d'un produit existant
        const { data: updatedProduct, error } = await supabase
          .from("products")
          .update({
            name: data.name,
            description: data.description,
            price: data.price,
            category_id: data.category_id,
            image_url: data.image_url,
            pieces: data.pieces,
            prep_time: data.prep_time,
            is_vegetarian: data.is_vegetarian,
            is_spicy: data.is_spicy,
            is_new: data.is_new,
            is_best_seller: data.is_best_seller,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id)
          .select();

        if (error) throw error;
        
        // Récupérer tous les produits mis à jour
        const { data: allProducts } = await supabase
          .from("products")
          .select("*")
          .order("name");
        
        onSave(allProducts || []);
        
        toast({
          title: "Produit mis à jour",
          description: `${data.name} a été mis à jour avec succès`,
        });
      } else {
        // Ajout d'un nouveau produit
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: data.name,
            description: data.description,
            price: data.price,
            category_id: data.category_id,
            image_url: data.image_url,
            pieces: data.pieces,
            prep_time: data.prep_time,
            is_vegetarian: data.is_vegetarian,
            is_spicy: data.is_spicy,
            is_new: data.is_new,
            is_best_seller: data.is_best_seller,
          })
          .select();

        if (error) throw error;
        
        // Récupérer tous les produits mis à jour
        const { data: allProducts } = await supabase
          .from("products")
          .select("*")
          .order("name");
        
        onSave(allProducts || []);
        
        toast({
          title: "Produit ajouté",
          description: `${data.name} a été ajouté avec succès`,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement du produit:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement du produit",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom*</FormLabel>
                <FormControl>
                  <Input placeholder="Nom du produit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie*</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  placeholder="Description du produit"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de l'image</FormLabel>
                <FormControl>
                  <Input placeholder="URL de l'image" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  URL vers l'image du produit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pieces"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de pièces</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prep_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temps de préparation (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 10 : parseInt(e.target.value, 10);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Temps de préparation en minutes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="is_vegetarian"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Végétarien</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_spicy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Épicé</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_best_seller"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Best-seller</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_new"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Actif</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : product ? "Mettre à jour" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
