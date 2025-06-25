
import { supabase } from "@/integrations/supabase/client";
import { MenuItem, MenuCategory } from "@/types";

export const getMenuData = async (restaurantId?: string): Promise<MenuCategory[]> => {
  try {
    // Si aucun restaurant spécifié, utiliser Châteaurenard par défaut
    const targetRestaurantId = restaurantId || '11111111-1111-1111-1111-111111111111';
    
    // Récupérer les catégories pour ce restaurant
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', targetRestaurantId)
      .order('display_order');

    if (categoriesError) {
      console.error('Erreur lors de la récupération des catégories:', categoriesError);
      throw categoriesError;
    }

    // Récupérer TOUS les produits actifs pour ce restaurant
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name)
      `)
      .eq('restaurant_id', targetRestaurantId)
      .or('is_new.eq.true,is_new.is.null')
      .order('name');

    if (productsError) {
      console.error('Erreur lors de la récupération des produits:', productsError);
      throw productsError;
    }

    console.log(`📦 Produits récupérés pour restaurant ${targetRestaurantId}:`, productsData?.length || 0);

    // Transformer les données
    const categories: MenuCategory[] = categoriesData.map(category => {
      const categoryProducts = productsData
        .filter(product => product.category_id === category.id)
        .map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price?.toString() || '0'),
          imageUrl: product.image_url || '',
          category: product.category_id as any,
          isVegetarian: product.is_vegetarian || false,
          isSpicy: product.is_spicy || false,
          isNew: product.is_new !== false,
          isBestSeller: product.is_best_seller || false,
          isGlutenFree: product.is_gluten_free || false,
          allergens: product.allergens || [],
          pieces: product.pieces,
          prepTime: product.prep_time || 10
        })) as MenuItem[];

      console.log(`📂 Catégorie ${category.name}: ${categoryProducts.length} produits`);

      return {
        id: category.id as any,
        name: category.name,
        description: category.description || '',
        items: categoryProducts
      };
    });

    return categories;
  } catch (error) {
    console.error('Erreur dans getMenuData:', error);
    return [];
  }
};

export const initializeCategories = async (restaurantId: string): Promise<boolean> => {
  try {
    console.log(`Début de l'initialisation des catégories pour restaurant ${restaurantId}...`);
    
    // Vérifier si des catégories existent déjà pour ce restaurant
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (checkError) {
      console.error('Erreur lors de la vérification des catégories:', checkError);
      return false;
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log('Des catégories existent déjà pour ce restaurant, initialisation ignorée');
      return true;
    }

    // Créer les catégories par défaut pour ce restaurant
    const defaultCategories = [
      { id: 'box', name: 'Box', description: null, display_order: 0, restaurant_id: restaurantId },
      { id: 'plateaux', name: 'Plateaux', description: null, display_order: 1, restaurant_id: restaurantId },
      { id: 'yakitori', name: 'Yakitori', description: null, display_order: 2, restaurant_id: restaurantId },
      { id: 'accompagnements', name: 'Accompagnements', description: null, display_order: 3, restaurant_id: restaurantId },
      { id: 'desserts', name: 'Desserts', description: null, display_order: 4, restaurant_id: restaurantId },
      { id: 'gunkan', name: 'Gunkan', description: null, display_order: 5, restaurant_id: restaurantId },
      { id: 'sashimi', name: 'Sashimi', description: null, display_order: 6, restaurant_id: restaurantId },
      { id: 'poke', name: 'Poke Bowl', description: null, display_order: 7, restaurant_id: restaurantId },
      { id: 'chirashi', name: 'Chirashi', description: null, display_order: 8, restaurant_id: restaurantId },
      { id: 'green', name: 'Green', description: null, display_order: 9, restaurant_id: restaurantId },
      { id: 'nigiri', name: 'Nigiri', description: null, display_order: 10, restaurant_id: restaurantId },
      { id: 'signature', name: 'Signature', description: null, display_order: 11, restaurant_id: restaurantId },
      { id: 'temaki', name: 'Temaki', description: null, display_order: 12, restaurant_id: restaurantId },
      { id: 'maki_wrap', name: 'Maki Wrap', description: null, display_order: 13, restaurant_id: restaurantId },
      { id: 'maki', name: 'Maki', description: null, display_order: 14, restaurant_id: restaurantId },
      { id: 'california', name: 'California', description: null, display_order: 15, restaurant_id: restaurantId },
      { id: 'crispy', name: 'Crispy', description: null, display_order: 16, restaurant_id: restaurantId },
      { id: 'spring', name: 'Spring', description: null, display_order: 17, restaurant_id: restaurantId },
      { id: 'salmon', name: 'Salmon', description: null, display_order: 18, restaurant_id: restaurantId },
      { id: 'boissons', name: 'Boissons', description: null, display_order: 19, restaurant_id: restaurantId },
      { id: 'box_du_midi', name: 'Box du Midi', description: null, display_order: 20, restaurant_id: restaurantId },
      { id: 'custom', name: 'Personnalisé', description: null, display_order: 21, restaurant_id: restaurantId },
      { id: 'poke_custom', name: 'Poke Personnalisé', description: null, display_order: 22, restaurant_id: restaurantId }
    ];

    console.log(`Insertion de ${defaultCategories.length} catégories pour restaurant ${restaurantId}...`);
    
    const { error: insertError } = await supabase
      .from('categories')
      .insert(defaultCategories);

    if (insertError) {
      console.error('Erreur lors de l\'insertion des catégories:', insertError);
      return false;
    }

    console.log('Catégories initialisées avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des catégories:', error);
    return false;
  }
};

export const initializeFullMenu = async (restaurantId: string): Promise<boolean> => {
  try {
    console.log(`Début de l'initialisation complète du menu pour restaurant ${restaurantId}...`);
    
    // Vérifier si des produits existent déjà pour ce restaurant
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (checkError) {
      console.error('Erreur lors de la vérification des produits:', checkError);
      return false;
    }

    if (existingProducts && existingProducts.length > 0) {
      console.log('Des produits existent déjà pour ce restaurant, initialisation ignorée');
      return true;
    }

    console.log('Aucun produit trouvé pour ce restaurant, l\'initialisation peut être faite via l\'interface admin');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du menu complet:', error);
    return false;
  }
};
