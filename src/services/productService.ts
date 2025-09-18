
import { supabase } from "@/integrations/supabase/client";
import { MenuItem, MenuCategory } from "@/types";
import { RESTAURANTS } from "./restaurantService";
import { 
  fetchCategories, 
  insertCategory, 
  fetchAllProducts, 
  productExistsInCategory, 
  insertProduct 
} from "@/integrations/supabase/client";

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

    // Récupérer TOUS les produits pour ce restaurant (y compris désactivés)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name)
      `)
      .eq('restaurant_id', targetRestaurantId)
      .order('price', { ascending: true });

    if (productsError) {
      console.error('Erreur lors de la récupération des produits:', productsError);
      throw productsError;
    }

    console.log(`📦 Produits récupérés pour restaurant ${targetRestaurantId}:`, productsData?.length || 0);
    
    // DEBUG: Afficher les catégories récupérées
    console.log(`🏷️ Catégories récupérées pour restaurant ${targetRestaurantId}:`, categoriesData?.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description
    })) || []);

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
          category: categoriesData.find(cat => cat.id === product.category_id)?.name || product.category_id,
          restaurant_id: product.restaurant_id, // AJOUT: Inclure le restaurant_id
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

      console.log(`🔍 Transformation catégorie:`, {
        id: category.id,
        name: category.name,
        description: category.description
      });
      
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

export const initializeCategories = async (restaurantId?: string): Promise<boolean> => {
  const targetRestaurantId = restaurantId || RESTAURANTS.CHATEAURENARD;
  console.log(`Initializing categories for restaurant: ${targetRestaurantId}`);
  
  try {
    // Vérifier si des catégories existent déjà pour ce restaurant
    const existingCategories = await fetchCategories(targetRestaurantId);
    if (existingCategories.length > 0) {
      console.log(`Categories already exist for restaurant ${targetRestaurantId}, skipping initialization`);
      return true;
    }

    // Créer les catégories par défaut pour ce restaurant
    const categories = [
      { id: "makis", name: "Makis", description: "Rouleaux de riz vinaigré", display_order: 0 },
      { id: "sashimis", name: "Sashimis", description: "Poisson cru sans riz", display_order: 1 },
      { id: "nigiris", name: "Nigiris", description: "Riz surmonté de poisson", display_order: 2 },
      { id: "california", name: "California", description: "Makis inversés aux algues à l'extérieur", display_order: 3 },
      { id: "plateaux", name: "Plateaux", description: "Assortiments de sushis", display_order: 4 },
      { id: "chirashis", name: "Chirashis", description: "Bol de riz aux poissons variés", display_order: 5 },
      { id: "soupes", name: "Soupes", description: "Soupes chaudes japonaises", display_order: 6 },
      { id: "boissons", name: "Boissons", description: "Boissons fraîches et chaudes", display_order: 7 },
      { id: "desserts", name: "Desserts", description: "Desserts japonais traditionnels", display_order: 8 }
    ];

    console.log(`Inserting ${categories.length} categories for restaurant ${targetRestaurantId}`);
    
    for (const category of categories) {
      await insertCategory({
        ...category,
        restaurant_id: targetRestaurantId
      });
    }

    console.log("Categories initialization completed successfully");
    return true;
  } catch (error) {
    console.error("Error initializing categories:", error);
    return false;
  }
};

export const initializeFullMenu = async (restaurantId?: string): Promise<boolean> => {
  const targetRestaurantId = restaurantId || RESTAURANTS.CHATEAURENARD;
  console.log(`Initializing full menu for restaurant: ${targetRestaurantId}`);
  
  try {
    // Vérifier si des produits existent déjà pour ce restaurant
    const existingProducts = await fetchAllProducts(targetRestaurantId);
    if (existingProducts.length > 0) {
      console.log(`Products already exist for restaurant ${targetRestaurantId}, skipping initialization`);
      return true;
    }

    // Créer les produits par défaut pour ce restaurant
    const makisProducts = [
      {
        name: "Maki Saumon",
        description: "Riz vinaigré, saumon frais, algue nori",
        price: 4.50,
        category_id: "makis",
        image_url: "/lovable-uploads/2443ae61-1e76-42ea-a1fd-0506bb67f970.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 6
      },
      {
        name: "Maki Thon",
        description: "Riz vinaigré, thon rouge, algue nori",
        price: 5.00,
        category_id: "makis",
        image_url: "/lovable-uploads/410b6967-e49b-4913-9f13-24e5279ee4f5.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 6
      },
      {
        name: "Maki Avocat",
        description: "Riz vinaigré, avocat frais, algue nori",
        price: 3.50,
        category_id: "makis",
        image_url: "/lovable-uploads/80663134-a018-4c55-8a81-5ee048c700e3.png",
        is_vegetarian: true,
        is_spicy: false,
        pieces: 6
      },
      {
        name: "Maki Concombre",
        description: "Riz vinaigré, concombre croquant, algue nori",
        price: 3.00,
        category_id: "makis",
        image_url: "/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png",
        is_vegetarian: true,
        is_spicy: false,
        pieces: 6
      }
    ];

    const sashimisProducts = [
      {
        name: "Sashimi Saumon",
        description: "Tranches fines de saumon frais",
        price: 8.00,
        category_id: "sashimis",
        image_url: "/lovable-uploads/c2d085bb-4d47-41fc-b430-0ed97076ece3.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 5
      },
      {
        name: "Sashimi Thon",
        description: "Tranches fines de thon rouge",
        price: 9.00,
        category_id: "sashimis",
        image_url: "/lovable-uploads/0f3ef4af-3737-45b0-a552-0c84028dd3cd.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 5
      }
    ];

    const nigirisProducts = [
      {
        name: "Nigiri Saumon",
        description: "Riz vinaigré surmonté de saumon",
        price: 2.50,
        category_id: "nigiris",
        image_url: "/lovable-uploads/ab0cbaa4-7dab-449d-b422-e426b7812e41.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 1
      },
      {
        name: "Nigiri Thon",
        description: "Riz vinaigré surmonté de thon",
        price: 3.00,
        category_id: "nigiris",
        image_url: "/lovable-uploads/c30dd633-dfec-4589-afdf-9cf0abf72049.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 1
      }
    ];

    const californiaProducts = [
      {
        name: "California Saumon Avocat",
        description: "Saumon, avocat, concombre, sauce épicée",
        price: 6.50,
        category_id: "california",
        image_url: "/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png",
        is_vegetarian: false,
        is_spicy: true,
        pieces: 8,
        is_best_seller: true
      },
      {
        name: "California Thon Épicé",
        description: "Thon épicé, avocat, concombre",
        price: 7.00,
        category_id: "california",
        image_url: "/lovable-uploads/e94446cb-ba03-42bd-a3bc-9562513a950e.png",
        is_vegetarian: false,
        is_spicy: true,
        pieces: 8
      }
    ];

    const plateauxProducts = [
      {
        name: "Plateau Découverte",
        description: "Assortiment de 20 pièces : makis, nigiris, california",
        price: 24.90,
        category_id: "plateaux",
        image_url: "/lovable-uploads/b09ca63a-4c04-46fa-9754-c3486bc3dca3.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 20,
        is_new: true
      },
      {
        name: "Plateau Premium",
        description: "Sélection premium de 30 pièces avec sashimis",
        price: 39.90,
        category_id: "plateaux",
        image_url: "/lovable-uploads/b09ca63a-4c04-46fa-9754-c3486bc3dca3.png",
        is_vegetarian: false,
        is_spicy: false,
        pieces: 30,
        is_best_seller: true
      }
    ];

    const allProducts = [
      ...makisProducts,
      ...sashimisProducts,
      ...nigirisProducts,
      ...californiaProducts,
      ...plateauxProducts
    ];

    console.log(`Inserting ${allProducts.length} products for restaurant ${targetRestaurantId}`);
    
    for (const product of allProducts) {
      try {
        // Vérifier si le produit existe déjà
        const exists = await productExistsInCategory(product.name, product.category_id, targetRestaurantId);
        if (!exists) {
          await insertProduct({
            ...product,
            restaurant_id: targetRestaurantId
          });
          console.log(`Inserted product: ${product.name}`);
        } else {
          console.log(`Product ${product.name} already exists, skipping`);
        }
      } catch (error) {
        console.error(`Error inserting product ${product.name}:`, error);
      }
    }

    console.log("Full menu initialization completed successfully");
    return true;
  } catch (error) {
    console.error("Error initializing full menu:", error);
    return false;
  }
};
