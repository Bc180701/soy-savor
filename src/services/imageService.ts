
// Service pour gérer les images des produits
import { supabase } from "@/integrations/supabase/client";
import type { SushiCategory } from "@/types";

// Liste d'URLs d'images cohérentes par catégorie
const imagesByCategory: Record<SushiCategory, string[]> = {
  box: [
    "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop"
  ],
  box_du_midi: [
    "https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=1000&auto=format&fit=crop"
  ],
  plateaux: [
    "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?q=80&w=1000&auto=format&fit=crop"
  ],
  yakitori: [
    "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534604973900-c43ab4fdeca7?q=80&w=1000&auto=format&fit=crop"
  ],
  accompagnements: [
    "https://images.unsplash.com/photo-1564489563601-c53cfc451e93?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000&auto=format&fit=crop"
  ],
  desserts: [
    "https://images.unsplash.com/photo-1541599188778-cdc73298e8fd?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=1000&auto=format&fit=crop"
  ],
  gunkan: [
    "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562802378-063ec186a863?q=80&w=1000&auto=format&fit=crop"
  ],
  sashimi: [
    "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?q=80&w=1000&auto=format&fit=crop"
  ],
  poke: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541519227354-08fa5d50ae7d?q=80&w=1000&auto=format&fit=crop"
  ],
  chirashi: [
    "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop"
  ],
  green: [
    "https://images.unsplash.com/photo-1602491674275-16bf23e43461?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1602491673980-73aa38daa4d5?q=80&w=1000&auto=format&fit=crop"
  ],
  nigiri: [
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1563612116891-9b03e4bb9b07?q=80&w=1000&auto=format&fit=crop"
  ],
  signature: [
    "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558985212-91a2d080c414?q=80&w=1000&auto=format&fit=crop"
  ],
  temaki: [
    "https://images.unsplash.com/photo-1605305834869-5cdbd9199673?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568003555483-28113da3bc68?q=80&w=1000&auto=format&fit=crop"
  ],
  maki_wrap: [
    "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?q=80&w=1000&auto=format&fit=crop"
  ],
  maki: [
    "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?q=80&w=1000&auto=format&fit=crop"
  ],
  california: [
    "https://images.unsplash.com/photo-1615361200141-f45040f367be?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=1000&auto=format&fit=crop"
  ],
  crispy: [
    "https://images.unsplash.com/photo-1562802378-063ec186a863?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565702832109-03e68de0fc7d?q=80&w=1000&auto=format&fit=crop"
  ],
  spring: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?q=80&w=1000&auto=format&fit=crop"
  ],
  salmon: [
    "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1000&auto=format&fit=crop"
  ],
  boissons: [
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=1000&auto=format&fit=crop"
  ]
};

// Obtenir une image aléatoire pour une catégorie donnée
export const getRandomImageForCategory = (category: SushiCategory): string => {
  const images = imagesByCategory[category] || [];
  if (images.length === 0) {
    return "/placeholder.svg";
  }
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

// Mettre à jour les images de tous les produits
export const updateAllProductImages = async (): Promise<boolean> => {
  try {
    // D'abord récupérer tous les produits
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, category_id');
    
    if (fetchError || !products) {
      console.error("Erreur lors de la récupération des produits:", fetchError);
      return false;
    }

    // Mettre à jour les images pour chaque produit
    for (const product of products) {
      const categoryId = product.category_id as SushiCategory;
      const imageUrl = getRandomImageForCategory(categoryId);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`Erreur lors de la mise à jour de l'image pour le produit ${product.id}:`, updateError);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour des images:", error);
    return false;
  }
};

// Mettre à jour l'image d'un produit spécifique
export const updateProductImage = async (productId: string, category: SushiCategory): Promise<boolean> => {
  try {
    const imageUrl = getRandomImageForCategory(category);
    
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'image pour le produit ${productId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'image:", error);
    return false;
  }
};
