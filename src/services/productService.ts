
import { supabase } from "@/integrations/supabase/client";
import { MenuItem, MenuCategory } from "@/types";

export const getMenuData = async (): Promise<MenuCategory[]> => {
  try {
    // Récupérer les catégories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (categoriesError) {
      console.error('Erreur lors de la récupération des catégories:', categoriesError);
      throw categoriesError;
    }

    // Récupérer les produits avec leurs catégories
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name)
      `)
      .order('name');

    if (productsError) {
      console.error('Erreur lors de la récupération des produits:', productsError);
      throw productsError;
    }

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
          isNew: product.is_new || false,
          isBestSeller: product.is_best_seller || false,
          isGlutenFree: product.is_gluten_free || false,
          allergens: product.allergens || [],
          pieces: product.pieces,
          prepTime: product.prep_time || 10
        })) as MenuItem[];

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

export const initializeCategories = async (): Promise<boolean> => {
  try {
    console.log("Début de l'initialisation des catégories...");
    
    // Vérifier si des catégories existent déjà
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id');

    if (checkError) {
      console.error('Erreur lors de la vérification des catégories:', checkError);
      return false;
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log('Des catégories existent déjà, initialisation ignorée');
      return true;
    }

    // Créer les catégories par défaut
    const defaultCategories = [
      { id: 'box', name: 'Box', description: null, display_order: 0 },
      { id: 'plateaux', name: 'Plateaux', description: null, display_order: 1 },
      { id: 'yakitori', name: 'Yakitori', description: null, display_order: 2 },
      { id: 'accompagnements', name: 'Accompagnements', description: null, display_order: 3 },
      { id: 'desserts', name: 'Desserts', description: null, display_order: 4 },
      { id: 'gunkan', name: 'Gunkan', description: null, display_order: 5 },
      { id: 'sashimi', name: 'Sashimi', description: null, display_order: 6 },
      { id: 'poke', name: 'Poke Bowl', description: null, display_order: 7 },
      { id: 'chirashi', name: 'Chirashi', description: null, display_order: 8 },
      { id: 'green', name: 'Green', description: null, display_order: 9 },
      { id: 'nigiri', name: 'Nigiri', description: null, display_order: 10 },
      { id: 'signature', name: 'Signature', description: null, display_order: 11 },
      { id: 'temaki', name: 'Temaki', description: null, display_order: 12 },
      { id: 'maki_wrap', name: 'Maki Wrap', description: null, display_order: 13 },
      { id: 'maki', name: 'Maki', description: null, display_order: 14 },
      { id: 'california', name: 'California', description: null, display_order: 15 },
      { id: 'crispy', name: 'Crispy', description: null, display_order: 16 },
      { id: 'spring', name: 'Spring', description: null, display_order: 17 },
      { id: 'salmon', name: 'Salmon', description: null, display_order: 18 },
      { id: 'boissons', name: 'Boissons', description: null, display_order: 19 },
      { id: 'box_du_midi', name: 'Box du Midi', description: null, display_order: 20 },
      { id: 'custom', name: 'Personnalisé', description: null, display_order: 21 },
      { id: 'poke_custom', name: 'Poke Personnalisé', description: null, display_order: 22 }
    ];

    console.log(`Insertion de ${defaultCategories.length} catégories...`);
    
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

export const initializeFullMenu = async (): Promise<boolean> => {
  try {
    console.log("Début de l'initialisation complète du menu...");
    
    // Vérifier si des produits existent déjà
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id');

    if (checkError) {
      console.error('Erreur lors de la vérification des produits:', checkError);
      return false;
    }

    if (existingProducts && existingProducts.length > 0) {
      console.log('Des produits existent déjà, initialisation ignorée');
      return true;
    }

    console.log('Aucun produit trouvé, l\'initialisation peut être faite via l\'interface admin');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du menu complet:', error);
    return false;
  }
};
