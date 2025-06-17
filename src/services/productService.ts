
import { supabase } from "@/integrations/supabase/client";
import { MenuItem, MenuCategory } from "@/types";
import { menuData } from "@/data/menuData";

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
      .eq('is_new', true)
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

    // Extraire les catégories uniques du menu de données
    const categories = Array.from(new Set(menuData.map(item => item.category)))
      .map((categoryId, index) => {
        const categoryNames: { [key: string]: string } = {
          'box': 'Box',
          'plateaux': 'Plateaux',
          'yakitori': 'Yakitori',
          'accompagnements': 'Accompagnements',
          'desserts': 'Desserts',
          'gunkan': 'Gunkan',
          'sashimi': 'Sashimi',
          'poke': 'Poke Bowl',
          'chirashi': 'Chirashi',
          'green': 'Green',
          'nigiri': 'Nigiri',
          'signature': 'Signature',
          'temaki': 'Temaki',
          'maki_wrap': 'Maki Wrap',
          'maki': 'Maki',
          'california': 'California',
          'crispy': 'Crispy',
          'spring': 'Spring',
          'salmon': 'Salmon',
          'boissons': 'Boissons',
          'box_du_midi': 'Box du Midi',
          'custom': 'Personnalisé',
          'poke_custom': 'Poke Personnalisé'
        };

        return {
          id: categoryId,
          name: categoryNames[categoryId] || categoryId,
          description: null,
          display_order: index
        };
      });

    console.log(`Insertion de ${categories.length} catégories...`);
    
    const { error: insertError } = await supabase
      .from('categories')
      .insert(categories);

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

    // Transformer les données du menu en format pour la base de données
    const products = menuData.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.imageUrl || null,
      category_id: item.category,
      is_vegetarian: item.isVegetarian || false,
      is_spicy: item.isSpicy || false,
      is_new: item.isNew !== false, // Par défaut true, sauf si explicitement false
      is_best_seller: item.isBestSeller || false,
      is_gluten_free: item.isGlutenFree || false,
      allergens: item.allergens || [],
      pieces: item.pieces || null,
      prep_time: item.prepTime || 10
    }));

    console.log(`Insertion de ${products.length} produits...`);
    
    // Insérer par lots pour éviter les erreurs de timeout
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('products')
        .insert(batch);

      if (insertError) {
        console.error(`Erreur lors de l'insertion du lot ${i / batchSize + 1}:`, insertError);
        return false;
      }
      
      console.log(`Lot ${i / batchSize + 1}/${Math.ceil(products.length / batchSize)} inséré avec succès`);
    }

    console.log('Menu complet initialisé avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du menu complet:', error);
    return false;
  }
};
