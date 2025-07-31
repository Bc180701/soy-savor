
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
import { Upload, Image, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

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
  is_gluten_free: z.boolean().default(false),
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(product?.image_url || null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [bucketImages, setBucketImages] = useState<any[]>([]);
  const [filteredImages, setFilteredImages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

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
    is_gluten_free: product?.is_gluten_free || false,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Télécharger l'image
      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error("Erreur détaillée:", uploadError);
        throw new Error(`Erreur de téléchargement: ${uploadError.message}`);
      }
      
      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;
      
      // Mettre à jour le formulaire avec l'URL de l'image
      form.setValue("image_url", publicUrl);
      setPreviewImage(publicUrl);
      
      toast({
        title: "Image téléchargée",
        description: "L'image a été téléchargée avec succès",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du téléchargement de l'image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const loadBucketImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('products')
        .list('', {
          limit: 1000,
          offset: 0,
        });

      if (error) throw error;

      const images = data
        ?.filter(file => file.metadata?.mimetype?.startsWith('image/'))
        .map(file => {
          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(file.name);
          return {
            name: file.name,
            url: publicUrlData.publicUrl,
          };
        }) || [];

      setBucketImages(images);
      setFilteredImages(images);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les images de la médiathèque",
        variant: "destructive",
      });
    }
  };

  const selectImageFromLibrary = (imageUrl: string) => {
    form.setValue("image_url", imageUrl);
    setPreviewImage(imageUrl);
    setMediaLibraryOpen(false);
    toast({
      title: "Image sélectionnée",
      description: "L'image a été sélectionnée depuis la médiathèque",
      variant: "success",
    });
  };

  const onSubmit = async (data: ProductFormValues) => {
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
            is_gluten_free: data.is_gluten_free,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id)
          .eq("restaurant_id", currentRestaurant.id)
          .select();

        if (error) throw error;
        
        // Récupérer tous les produits mis à jour pour ce restaurant
        const { data: allProducts } = await supabase
          .from("products")
          .select("*")
          .eq("restaurant_id", currentRestaurant.id)
          .order("name");
        
        onSave(allProducts || []);
        
        toast({
          title: "Produit mis à jour",
          description: `${data.name} a été mis à jour avec succès`,
          variant: "success",
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
            is_gluten_free: data.is_gluten_free,
            restaurant_id: currentRestaurant.id,
          })
          .select();

        if (error) throw error;
        
        // Récupérer tous les produits mis à jour pour ce restaurant
        const { data: allProducts } = await supabase
          .from("products")
          .select("*")
          .eq("restaurant_id", currentRestaurant.id)
          .order("name");
        
        onSave(allProducts || []);
        
        toast({
          title: "Produit ajouté",
          description: `${data.name} a été ajouté avec succès`,
          variant: "success",
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Image du produit</FormLabel>
                <div className="space-y-4">
                  {/* Prévisualisation de l'image */}
                  {previewImage && (
                    <div className="relative w-full max-w-[200px] h-[200px] border rounded-md overflow-hidden">
                      <img 
                        src={previewImage} 
                        alt="Aperçu" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  
                  {/* Champ d'URL caché */}
                  <Input
                    type="hidden"
                    {...field}
                    value={field.value || ""}
                  />
                  
                  {/* Boutons de téléchargement et médiathèque */}
                  <div className="flex gap-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 transition-colors w-fit">
                        <Upload size={16} />
                        <span>{uploadingImage ? "Téléchargement..." : "Télécharger une image"}</span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    
                    <Dialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={loadBucketImages}
                          className="flex items-center gap-2"
                        >
                          <Image size={16} />
                          Médiathèque
                        </Button>
                      </DialogTrigger>
                       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                         <DialogHeader>
                           <DialogTitle>Médiathèque - Images produits</DialogTitle>
                         </DialogHeader>
                         
                         {/* Barre de recherche */}
                         <div className="relative mb-4">
                           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                           <Input
                             placeholder="Rechercher une image..."
                             value={searchQuery}
                             onChange={(e) => {
                               const query = e.target.value.toLowerCase();
                               setSearchQuery(query);
                               const filtered = bucketImages.filter(image => 
                                 image.name.toLowerCase().includes(query)
                               );
                               setFilteredImages(filtered);
                             }}
                             className="pl-10"
                           />
                         </div>
                         
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                           {filteredImages.map((image, index) => (
                            <div
                              key={index}
                              className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                              onClick={() => selectImageFromLibrary(image.url)}
                            >
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                  Sélectionner
                                </span>
                              </div>
                              <div className="p-2">
                                <p className="text-xs text-gray-600 truncate" title={image.name}>
                                  {image.name}
                                </p>
                              </div>
                            </div>
                          ))}
                           {filteredImages.length === 0 && bucketImages.length > 0 && (
                             <div className="col-span-full text-center py-8 text-gray-500">
                               Aucune image trouvée pour "{searchQuery}"
                             </div>
                           )}
                           {bucketImages.length === 0 && (
                             <div className="col-span-full text-center py-8 text-gray-500">
                               Aucune image trouvée dans la médiathèque
                             </div>
                           )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormDescription>
                    Formats acceptés: JPG, PNG, GIF (max 5MB)
                  </FormDescription>
                </div>
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            name="is_gluten_free"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Sans gluten</FormLabel>
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
          <Button type="submit" disabled={isSubmitting || uploadingImage}>
            {isSubmitting ? "Enregistrement..." : product ? "Mettre à jour" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
