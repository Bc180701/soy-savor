
import { supabase, fetchCategories, fetchProductsByCategory } from "@/integrations/supabase/client";
import type { MenuItem, MenuCategory, SushiCategory } from "@/types";

// Transform database product to MenuItem
const transformProductToMenuItem = (product: any): MenuItem => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.image_url || "/placeholder.svg",
    category: product.category_id as SushiCategory, // Cast to SushiCategory
    isVegetarian: product.is_vegetarian || false,
    isSpicy: product.is_spicy || false,
    isNew: product.is_new || false,
    isBestSeller: product.is_best_seller || false,
    allergens: product.allergens,
    pieces: product.pieces
  };
};

// Get all menu categories with their items
export const getMenuData = async (): Promise<MenuCategory[]> => {
  try {
    // Fetch all categories
    const categories = await fetchCategories();
    
    // Create result array
    const menuData: MenuCategory[] = [];
    
    // For each category, fetch its products
    for (const category of categories) {
      const products = await fetchProductsByCategory(category.id);
      
      // Transform products to menu items
      const menuItems = products.map(transformProductToMenuItem);
      
      // Add category with its items to the result
      menuData.push({
        id: category.id,
        name: category.name,
        description: category.description,
        items: menuItems
      });
    }
    
    return menuData;
  } catch (error) {
    console.error("Error fetching menu data:", error);
    return [];
  }
};

// Add a single product to the database
export const addProduct = async (product: Omit<MenuItem, 'id'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category, // This is now correctly typed
      image_url: product.imageUrl,
      is_vegetarian: product.isVegetarian,
      is_spicy: product.isSpicy,
      is_new: product.isNew,
      is_best_seller: product.isBestSeller,
      allergens: product.allergens,
      pieces: product.pieces
    }])
    .select();
    
  if (error) {
    throw error;
  }
  
  return data?.[0];
};

// Update a product in the database
export const updateProduct = async (id: string, updates: Partial<MenuItem>) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: updates.name,
      description: updates.description,
      price: updates.price,
      category_id: updates.category as string, // Cast to string for database
      image_url: updates.imageUrl,
      is_vegetarian: updates.isVegetarian,
      is_spicy: updates.isSpicy,
      is_new: updates.isNew,
      is_best_seller: updates.isBestSeller,
      allergens: updates.allergens,
      pieces: updates.pieces
    })
    .eq('id', id)
    .select();
    
  if (error) {
    throw error;
  }
  
  return data?.[0];
};

// Delete a product from the database
export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
    
  if (error) {
    throw error;
  }
  
  return true;
};
