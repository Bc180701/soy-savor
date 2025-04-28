
import { supabase, fetchCategories, fetchProductsByCategory, insertCategory, insertProduct } from "@/integrations/supabase/client";
import type { MenuItem, MenuCategory, SushiCategory } from "@/types";

// Transform database product to MenuItem
const transformProductToMenuItem = (product: any): MenuItem => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.image_url || "/placeholder.svg",
    category: product.category_id as SushiCategory,
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
        id: category.id as SushiCategory,
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

// Initialize all menu categories
export const initializeCategories = async () => {
  try {
    const categoriesToInsert = [
      { id: 'box_du_midi', name: 'Box du midi', description: 'Uniquement de 11h à 14h', display_order: 1 },
      { id: 'plateaux', name: 'Plateaux', description: 'Nos sélections de plateaux pour toutes les occasions', display_order: 2 },
      { id: 'poke', name: 'Poké Bowl', description: 'Bols composés de riz et garnitures variées', display_order: 3 },
      { id: 'maki', name: 'Maki', description: '6 pièces', display_order: 4 },
      { id: 'nigiri', name: 'Nigiri', description: '2 pièces', display_order: 5 },
      { id: 'california', name: 'California', description: '6 pièces', display_order: 6 },
      { id: 'crispy', name: 'Crispy', description: '6 pièces', display_order: 7 },
      { id: 'spring', name: 'Spring', description: '6 pièces', display_order: 8 },
      { id: 'salmon', name: 'Salmon', description: '6 pièces', display_order: 9 },
      { id: 'green', name: 'Green', description: 'Rolls à l\'avocat', display_order: 10 },
      { id: 'maki_wrap', name: 'Sushi Wrap', description: '2 pièces', display_order: 11 },
      { id: 'temaki', name: 'Temaki', description: '1 pièce', display_order: 12 },
      { id: 'gunkan', name: 'Gunkan', description: '2 pièces', display_order: 13 },
      { id: 'signature', name: 'Signature', description: 'Nos créations exclusives', display_order: 14 },
      { id: 'sashimi', name: 'Sashimi', description: 'Poisson cru tranché', display_order: 15 },
      { id: 'chirashi', name: 'Chirashi', description: 'Bol de riz vinaigré avec poisson cru', display_order: 16 },
      { id: 'yakitori', name: 'Yakitori', description: 'Brochettes et fritures japonaises', display_order: 17 },
      { id: 'accompagnements', name: 'Accompagnements', description: 'Pour compléter votre repas', display_order: 18 },
      { id: 'desserts', name: 'Desserts', description: 'Douceurs pour terminer votre repas', display_order: 19 },
      { id: 'boissons', name: 'Boissons', description: 'Notre sélection de boissons', display_order: 20 }
    ];
    
    for (const category of categoriesToInsert) {
      await insertCategory(category);
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing categories:", error);
    return false;
  }
};

// Initialize sample products
export const initializeSampleProducts = async () => {
  try {
    // Box du midi
    await insertProduct({
      name: 'LUNCH BOX',
      description: '6 California saumon avocat cheese, 3 California caesar, 2 Nigiri saumon cheese',
      price: 14.50,
      category_id: 'box_du_midi',
      is_vegetarian: false,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      pieces: 11,
      allergens: ['poisson', 'gluten', 'lactose'],
      image_url: '/placeholder.svg'
    });
    
    await insertProduct({
      name: 'SUSHIEATS BOX',
      description: '6 Crispy poulet tempura avocat spicy, 6 Nigiri saumon',
      price: 18.90,
      category_id: 'box_du_midi',
      is_vegetarian: false,
      is_spicy: true,
      is_new: false,
      is_best_seller: false,
      pieces: 12,
      allergens: ['poisson', 'gluten'],
      image_url: '/placeholder.svg'
    });
    
    // Plateaux
    await insertProduct({
      name: 'LE CLASSIQUE',
      description: '6 Maki saumon, 6 California thon concombre avocat, 6 Salmon cheese',
      price: 17.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      pieces: 18,
      allergens: ['poisson', 'lactose'],
      image_url: '/placeholder.svg'
    });
    
    await insertProduct({
      name: 'LE VEGÉTARIEN',
      description: '6 Maki Avocat Concombre Carotte, 6 California Chèvre Miel, 6 Spring Concombre Cheese, 6 Green Avocado Concombre Carotte Cheese',
      price: 21.90,
      category_id: 'plateaux',
      is_vegetarian: true,
      is_spicy: false,
      is_new: false,
      is_best_seller: false,
      pieces: 24,
      allergens: ['lactose', 'miel'],
      image_url: '/placeholder.svg'
    });
    
    // Poké Bowl
    await insertProduct({
      name: 'POKÉ SAUMON',
      description: 'Riz, saumon, chou rouge, édamame, concombre, radis, avocat, carotte, graine de sésame, sauce sucrée',
      price: 14.90,
      category_id: 'poke',
      is_vegetarian: false,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      allergens: ['poisson', 'sésame', 'soja'],
      image_url: '/placeholder.svg'
    });
    
    await insertProduct({
      name: 'POKÉ VEGGIE',
      description: 'Riz, tofu, chou rouge, édamame, concombre, radis, avocat, carotte, graine de sésame, oignon frit, sauce sucrée',
      price: 13.90,
      category_id: 'poke',
      is_vegetarian: true,
      is_spicy: false,
      is_new: false,
      is_best_seller: false,
      allergens: ['soja', 'sésame'],
      image_url: '/placeholder.svg'
    });
    
    // Maki
    await insertProduct({
      name: 'MAKI SAUMON',
      description: 'Maki au saumon',
      price: 5.60,
      category_id: 'maki',
      is_vegetarian: false,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      pieces: 6,
      allergens: ['poisson'],
      image_url: '/placeholder.svg'
    });
    
    await insertProduct({
      name: 'MAKI AVOCAT CONCOMBRE',
      description: 'Maki végétarien',
      price: 5.50,
      category_id: 'maki',
      is_vegetarian: true,
      is_spicy: false,
      is_new: false,
      is_best_seller: false,
      pieces: 6,
      image_url: '/placeholder.svg'
    });
    
    // Nigiri
    await insertProduct({
      name: 'NIGIRI SAUMON',
      description: 'Nigiri au saumon',
      price: 4.50,
      category_id: 'nigiri',
      is_vegetarian: false,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      pieces: 2,
      allergens: ['poisson'],
      image_url: '/placeholder.svg'
    });
    
    // California
    await insertProduct({
      name: 'CALIFORNIA SAUMON AVOCAT',
      description: 'California roll au saumon et avocat',
      price: 6.20,
      category_id: 'california',
      is_vegetarian: false,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      pieces: 6,
      allergens: ['poisson'],
      image_url: '/placeholder.svg'
    });
    
    // Crispy
    await insertProduct({
      name: 'CRISPY POULET TEMPURA',
      description: 'Crispy roll au poulet tempura, avocat et sauce épicée',
      price: 7.10,
      category_id: 'crispy',
      is_vegetarian: false,
      is_spicy: true,
      is_new: false,
      is_best_seller: true,
      pieces: 6,
      allergens: ['gluten'],
      image_url: '/placeholder.svg'
    });
    
    // Desserts
    await insertProduct({
      name: 'CALIFORNIA BANANE NUTELLA',
      description: 'California roll sucré à la banane et nutella',
      price: 4.50,
      category_id: 'desserts',
      is_vegetarian: true,
      is_spicy: false,
      is_new: false,
      is_best_seller: true,
      pieces: 8,
      allergens: ['fruits à coque', 'lactose'],
      image_url: '/placeholder.svg'
    });
    
    // Boissons
    await insertProduct({
      name: 'LIMONADE JAPONAISE',
      description: 'Limonade au yuzu',
      price: 3.50,
      category_id: 'boissons',
      is_vegetarian: true,
      is_spicy: false,
      is_new: true,
      is_best_seller: false,
      image_url: '/placeholder.svg'
    });
    
    return true;
  } catch (error) {
    console.error("Error initializing sample products:", error);
    return false;
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
      category_id: product.category,
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
  // Create an update object that maps MenuItem properties to database column names
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.category !== undefined) updateData.category_id = updates.category;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.isVegetarian !== undefined) updateData.is_vegetarian = updates.isVegetarian;
  if (updates.isSpicy !== undefined) updateData.is_spicy = updates.isSpicy;
  if (updates.isNew !== undefined) updateData.is_new = updates.isNew;
  if (updates.isBestSeller !== undefined) updateData.is_best_seller = updates.isBestSeller;
  if (updates.allergens !== undefined) updateData.allergens = updates.allergens;
  if (updates.pieces !== undefined) updateData.pieces = updates.pieces;
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
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
