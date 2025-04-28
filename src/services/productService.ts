
import { supabase, fetchCategories, fetchProductsByCategory, insertCategory, insertProduct, productExistsInCategory } from "@/integrations/supabase/client";
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
      { id: 'temaki', name: 'Temaki Twist', description: '1 pièce', display_order: 12 },
      { id: 'gunkan', name: 'Gunkan', description: '2 pièces', display_order: 13 },
      { id: 'triangle', name: 'Triangle Sankaku', description: '1 pièce', display_order: 14 },
      { id: 'signature', name: 'Signature', description: 'Nos créations exclusives', display_order: 15 },
      { id: 'sashimi', name: 'Sashimi & Tataki', description: 'Poisson cru tranché', display_order: 16 },
      { id: 'chirashi', name: 'Chirashi', description: 'Bol de riz vinaigré avec poisson cru', display_order: 17 },
      { id: 'tartare', name: 'Tartare', description: 'Préparations à base de poisson cru', display_order: 18 },
      { id: 'yakitori', name: 'Yakitori & Grill', description: 'Brochettes et fritures japonaises', display_order: 19 },
      { id: 'accompagnements', name: 'Accompagnements', description: 'Pour compléter votre repas', display_order: 20 },
      { id: 'desserts', name: 'Desserts', description: 'Douceurs pour terminer votre repas', display_order: 21 },
      { id: 'boissons', name: 'Boissons', description: 'Notre sélection de boissons', display_order: 22 }
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

// Initialize all products from the menu
export const initializeFullMenu = async () => {
  try {
    // Box du midi
    await tryInsertProduct({
      name: 'LUNCH BOX',
      description: '6 California saumon avocat cheese, 3 California caesar, 2 Nigiri saumon cheese',
      price: 14.50,
      category_id: 'box_du_midi',
      is_vegetarian: false,
      is_best_seller: true,
      pieces: 11,
      allergens: ['poisson', 'gluten', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'SUSHIEATS BOX',
      description: '6 Crispy poulet tempura avocat spicy, 6 Nigiri saumon',
      price: 18.90,
      category_id: 'box_du_midi',
      is_vegetarian: false,
      is_spicy: true,
      pieces: 12,
      allergens: ['poisson', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'TOKYO BOX',
      description: '6 california saumon avocat, 3 nigiri thon, 3 nigiri saumon',
      price: 19.90,
      category_id: 'box_du_midi',
      is_vegetarian: false,
      pieces: 12,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'WRAP BOX',
      description: 'Sushi Wraps au choix. Voir les saveurs disponible dans la catégorie « Sushi Wraps »',
      price: 7.90,
      category_id: 'box_du_midi',
      is_vegetarian: false
    });
    
    // Les plateaux
    await tryInsertProduct({
      name: 'LE MYSTÈRE',
      description: '18 pièces. Sélection du chef',
      price: 16.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      pieces: 18
    });
    
    await tryInsertProduct({
      name: 'LE GRILLÉ',
      description: '7 pièces. 2 yakitori bœuf fromage, 2 yakitori poulet, 1 poulet tempura',
      price: 15.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      pieces: 7,
      allergens: ['lactose', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'LE CLASSIQUE',
      description: '18 pièces. 6 Maki saumon, 6 California thon concombre avocat, 6 Salmon cheese',
      price: 17.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      is_best_seller: true,
      pieces: 18,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'LE VEGÉTARIEN',
      description: '24 pièces. 6 Maki Avocat Concombre Carotte, 6 California Chèvre Miel, 6 Spring Concombre Cheese, 6 Green Avocado Concombre Carotte Cheese',
      price: 21.90,
      category_id: 'plateaux',
      is_vegetarian: true,
      pieces: 24,
      allergens: ['lactose', 'miel']
    });
    
    await tryInsertProduct({
      name: 'LE GOURMAND',
      description: '42 pièces. 6 Maki thon, 6 California frenchy, 6 California saumon avocat cheese, 6 crispy poulet tempura, 6 spring saumon avocat concombre, 6 Salmon cheese, 3 Nigiri saumon cheese, 3 Nigiri thon',
      price: 52.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      pieces: 42,
      allergens: ['poisson', 'lactose', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'L\'AUTHENTIQUE',
      description: '50 pièces. 6 Maki Saumon cheese, 6 California Caesar, 6 California Chèvre miel, 6 Crispy Saumon Avocat Cheese, 6 Spring Poulet Tempura curry, 6 Spring crevette avocat menthe, 6 Rainbow roll, 2 Gunkan Œufs de saumon, 3 Nigiri Saumon, 3 Nigiri Crevette Tempura',
      price: 55.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      pieces: 50,
      allergens: ['poisson', 'lactose', 'gluten', 'crustacés', 'miel']
    });
    
    await tryInsertProduct({
      name: 'LE ROYAL',
      description: '60 pièces. 6 Maki Saumon, 6 California Chèvre Miel, 6 California Frenchy, 6 Crispy Crevette Tempura Avocat spicy, 6 Crispy Thon Cuit Avocat, 6 Spring Thon Avocat Concombre, 6 Salmon Cheese spicy snacké, 6 Green Avocado Poulet Tempura Avocat spicy, 6 Cheddar roll, 2 Gunkan Saumon, 2 Nigiri Thon Spicy Tobiko, 2 Nigiri Daurade',
      price: 75.90,
      category_id: 'plateaux',
      is_vegetarian: false,
      pieces: 60,
      allergens: ['poisson', 'lactose', 'gluten', 'crustacés', 'miel']
    });
    
    // Poke Bowl
    await tryInsertProduct({
      name: 'POKÉ SAUMON',
      description: 'Riz, saumon, chou rouge, édamame, concombre, radis, avocat, carotte, graine de sésame, sauce sucrée',
      price: 14.90,
      category_id: 'poke',
      is_vegetarian: false,
      is_best_seller: true,
      allergens: ['poisson', 'sésame', 'soja']
    });
    
    await tryInsertProduct({
      name: 'POKÉ POULET TEMPURA',
      description: 'Riz, poulet tempura, chou rouge, édamame, concombre, radis, avocat, carotte, graine de sésame, oignon frit, sauce sucrée',
      price: 13.90,
      category_id: 'poke',
      is_vegetarian: false,
      allergens: ['gluten', 'sésame', 'soja']
    });
    
    await tryInsertProduct({
      name: 'POKÉ VEGGIE',
      description: 'Riz, tofu, chou rouge, édamame, concombre, radis, avocat, carotte, graine de sésame, oignon frit, sauce sucrée',
      price: 13.90,
      category_id: 'poke',
      is_vegetarian: true,
      allergens: ['soja', 'sésame']
    });
    
    await tryInsertProduct({
      name: 'POKÉ SUSHIEATS',
      description: 'Riz, crevette tempura, chou rouge, édamame, concombre, avocat, algue wakame, chèvre, graine de sésame, oignon frit, sauce sucrée & sauce spicy mayo',
      price: 14.90,
      category_id: 'poke',
      is_vegetarian: false,
      allergens: ['crustacés', 'gluten', 'lactose', 'sésame', 'soja']
    });
    
    await tryInsertProduct({
      name: 'POKÉ CRÉA',
      description: 'Composez votre Poké bowl sur mesure selon vos envies',
      price: 15.90,
      category_id: 'poke',
      is_vegetarian: false
    });
    
    // Maki
    await tryInsertProduct({
      name: 'MAKI SAUMON',
      description: 'Maki au saumon',
      price: 5.60,
      category_id: 'maki',
      is_vegetarian: false,
      is_best_seller: true,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'MAKI SAUMON CHEESE',
      description: 'Maki au saumon et fromage frais',
      price: 5.90,
      category_id: 'maki',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'MAKI THON',
      description: 'Maki au thon',
      price: 5.90,
      category_id: 'maki',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'MAKI CREVETTE AVOCAT',
      description: 'Maki à la crevette et avocat',
      price: 5.90,
      category_id: 'maki',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés']
    });
    
    await tryInsertProduct({
      name: 'MAKI AVOCAT CONCOMBRE CAROTTE',
      description: 'Maki végétarien',
      price: 5.60,
      category_id: 'maki',
      is_vegetarian: true,
      pieces: 6
    });
    
    await tryInsertProduct({
      name: 'MAKI CONCOMBRE CHEESE',
      description: 'Maki végétarien au concombre et fromage frais',
      price: 5.50,
      category_id: 'maki',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose']
    });
    
    // Nigiri
    await tryInsertProduct({
      name: 'NIGIRI SAUMON',
      description: 'Nigiri au saumon',
      price: 4.50,
      category_id: 'nigiri',
      is_vegetarian: false,
      is_best_seller: true,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI SAUMON CHEESE',
      description: 'Nigiri au saumon et fromage frais',
      price: 4.90,
      category_id: 'nigiri',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI SAUMON TATAKI',
      description: 'Nigiri au saumon légèrement snacké',
      price: 4.70,
      category_id: 'nigiri',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI DAURADE',
      description: 'Nigiri à la daurade',
      price: 5.50,
      category_id: 'nigiri',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI THON',
      description: 'Nigiri au thon',
      price: 5.30,
      category_id: 'nigiri',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI THON SPICY TOBIKO',
      description: 'Nigiri au thon épicé et oeufs de poisson',
      price: 5.50,
      category_id: 'nigiri',
      is_vegetarian: false,
      is_spicy: true,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI CREVETTE',
      description: 'Nigiri à la crevette',
      price: 4.90,
      category_id: 'nigiri',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['crustacés']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI CREVETTE TEMPURA',
      description: 'Nigiri à la crevette tempura',
      price: 6.50,
      category_id: 'nigiri',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'NIGIRI AVOCAT',
      description: 'Nigiri à l\'avocat',
      price: 3.90,
      category_id: 'nigiri',
      is_vegetarian: true,
      pieces: 2
    });
    
    // California
    await tryInsertProduct({
      name: 'CALIFORNIA SAUMON AVOCAT',
      description: 'California roll au saumon et avocat',
      price: 6.20,
      category_id: 'california',
      is_vegetarian: false,
      is_best_seller: true,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA SAUMON AVOCAT CHEESE',
      description: 'California roll au saumon, avocat et fromage frais',
      price: 6.30,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA THON CONCOMBRE AVOCAT',
      description: 'California roll au thon, concombre et avocat',
      price: 6.50,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA THON CUIT CONCOMBRE AVOCAT',
      description: 'California roll au thon cuit, concombre et avocat',
      price: 6.50,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA CREVETTE AVOCAT',
      description: 'California roll à la crevette et avocat',
      price: 6.90,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA CHAIR DE CRABE CONCOMBRE CHEESE',
      description: 'California roll à la chair de crabe, concombre et fromage frais',
      price: 6.50,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA FRENCHY',
      description: 'California roll au foie gras',
      price: 8.50,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA CAESAR',
      description: 'California roll façon salade César',
      price: 7.50,
      category_id: 'california',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['gluten', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA CHÈVRE MIEL',
      description: 'California roll au chèvre et miel',
      price: 6.50,
      category_id: 'california',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose', 'miel']
    });
    
    await tryInsertProduct({
      name: 'CALIFORNIA VEGGIE',
      description: 'California roll concombre avocat cheese',
      price: 5.50,
      category_id: 'california',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose']
    });
    
    // Crispy
    await tryInsertProduct({
      name: 'CRISPY SAUMON AVOCAT CHEESE',
      description: 'Crispy roll au saumon, avocat et fromage frais',
      price: 6.50,
      category_id: 'crispy',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'CRISPY POULET TEMPURA AVOCAT SPICY',
      description: 'Crispy roll au poulet tempura, avocat et sauce épicée',
      price: 7.10,
      category_id: 'crispy',
      is_vegetarian: false,
      is_spicy: true,
      is_best_seller: true,
      pieces: 6,
      allergens: ['gluten']
    });
    
    await tryInsertProduct({
      name: 'CRISPY CREVETTE TEMPURA AVOCAT SPICY',
      description: 'Crispy roll à la crevette tempura, avocat et sauce épicée',
      price: 7.20,
      category_id: 'crispy',
      is_vegetarian: false,
      is_spicy: true,
      pieces: 6,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'CRISPY CREVETTE CONCOMBRE',
      description: 'Crispy roll à la crevette et concombre',
      price: 6.90,
      category_id: 'crispy',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'CRISPY THON CUIT AVOCAT',
      description: 'Crispy roll au thon cuit et avocat',
      price: 6.80,
      category_id: 'crispy',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'CRISPY VEGGIE',
      description: 'Crispy roll concombre avocat cheese',
      price: 5.90,
      category_id: 'crispy',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose', 'gluten']
    });
    
    // Spring
    await tryInsertProduct({
      name: 'SPRING SAUMON AVOCAT CONCOMBRE',
      description: 'Spring roll au saumon, avocat et concombre',
      price: 7.10,
      category_id: 'spring',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'SPRING THON AVOCAT CONCOMBRE',
      description: 'Spring roll au thon, avocat et concombre',
      price: 7.20,
      category_id: 'spring',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'SPRING THON CUIT AVOCAT CONCOMBRE',
      description: 'Spring roll au thon cuit, avocat et concombre',
      price: 7.20,
      category_id: 'spring',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'SPRING CREVETTE AVOCAT MENTHE',
      description: 'Spring roll à la crevette, avocat et menthe',
      price: 7.20,
      category_id: 'spring',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés']
    });
    
    await tryInsertProduct({
      name: 'SPRING CREVETTE TEMPURA AVOCAT CONCOMBRE',
      description: 'Spring roll à la crevette tempura, avocat et concombre',
      price: 7.70,
      category_id: 'spring',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'SPRING POULET TEMPURA CURRY AVOCAT',
      description: 'Spring roll au poulet tempura curry et avocat',
      price: 6.90,
      category_id: 'spring',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['gluten']
    });
    
    await tryInsertProduct({
      name: 'SPRING VEGGIE',
      description: 'Spring roll avocat cheese',
      price: 5.90,
      category_id: 'spring',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'SPRING FRESH',
      description: 'Spring roll concombre cheese',
      price: 5.90,
      category_id: 'spring',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose']
    });
    
    // Salmon
    await tryInsertProduct({
      name: 'SALMON CHEESE',
      description: 'Salmon roll au fromage frais',
      price: 7.60,
      category_id: 'salmon',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'SALMON CHEESE SPICY SNACKÉ',
      description: 'Salmon roll au fromage frais épicé légèrement snacké',
      price: 7.80,
      category_id: 'salmon',
      is_vegetarian: false,
      is_spicy: true,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'SALMON CONCOMBRE CHEESE',
      description: 'Salmon roll au concombre et fromage frais',
      price: 7.80,
      category_id: 'salmon',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'SALMON AVOCAT CHEESE',
      description: 'Salmon roll à l\'avocat et fromage frais',
      price: 7.90,
      category_id: 'salmon',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    // Green avocado
    await tryInsertProduct({
      name: 'GREEN AVOCADO SAUMON CHEESE',
      description: 'Roll avocat enrobant saumon et fromage frais',
      price: 7.90,
      category_id: 'green',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'GREEN AVOCADO SAUMON CONCOMBRE CHEESE',
      description: 'Roll avocat enrobant saumon, concombre et fromage frais',
      price: 8.10,
      category_id: 'green',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'GREEN AVOCADO THON CONCOMBRE',
      description: 'Roll avocat enrobant thon et concombre',
      price: 8.20,
      category_id: 'green',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'GREEN AVOCADO CREVETTE TEMPURA CONCOMBRE',
      description: 'Roll avocat enrobant crevette tempura et concombre',
      price: 9.50,
      category_id: 'green',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'GREEN AVOCADO POULET TEMPURA SPICY',
      description: 'Roll avocat enrobant poulet tempura épicé',
      price: 7.90,
      category_id: 'green',
      is_vegetarian: false,
      is_spicy: true,
      pieces: 6,
      allergens: ['gluten']
    });
    
    await tryInsertProduct({
      name: 'GREEN AVOCADO VEGGIE',
      description: 'Roll avocat enrobant concombre, carotte et fromage frais',
      price: 7.20,
      category_id: 'green',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose']
    });
    
    // Sushi Wrap
    await tryInsertProduct({
      name: 'SALMON WRAP',
      description: 'Saumon, salade, avocat, concombre, cheese, graine de sésame, sauce spicy mayo/teriyaki',
      price: 8.90,
      category_id: 'maki_wrap',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson', 'lactose', 'sésame']
    });
    
    await tryInsertProduct({
      name: 'TUNA WRAP',
      description: 'Thon cuit, salade, avocat, concombre, graine de sésame, sauce spicy mayo/teriyaki',
      price: 8.90,
      category_id: 'maki_wrap',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson', 'sésame']
    });
    
    await tryInsertProduct({
      name: 'TEMP WRAP',
      description: 'Crevette tempura, salade, avocat, concombre, graine de sésame, sauce spicy mayo/teriyaki',
      price: 8.90,
      category_id: 'maki_wrap',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['crustacés', 'gluten', 'sésame']
    });
    
    await tryInsertProduct({
      name: 'CAESAR WRAP',
      description: 'Poulet tempura, salade, gressin, copeaux de parmesan, graine de sésame, sauce Caesar/teriyaki',
      price: 8.50,
      category_id: 'maki_wrap',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['gluten', 'lactose', 'sésame']
    });
    
    await tryInsertProduct({
      name: 'CURRY WRAP',
      description: 'Poulet tempura, salade, avocat, concombre, graine de sésame, sauce curry/teriyaki',
      price: 8.50,
      category_id: 'maki_wrap',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['gluten', 'sésame']
    });
    
    await tryInsertProduct({
      name: 'VEGGIE WRAP',
      description: 'Tofu grillé, salade, avocat, concombre, carotte, cheese, cerneaux de noix, sauce spicy mayo/teriyaki',
      price: 7.90,
      category_id: 'maki_wrap',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['soja', 'lactose', 'fruits à coque']
    });
    
    // Temaki twist
    await tryInsertProduct({
      name: 'TEMAKI SAUMON',
      description: 'Saumon, avocat, concombre, salade, œuf de tobiko',
      price: 5.50,
      category_id: 'temaki',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TEMAKI THON',
      description: 'Thon, avocat, concombre, salade, œuf de tobiko',
      price: 5.90,
      category_id: 'temaki',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TEMAKI POULET TEMPURA',
      description: 'Poulet tempura, avocat, concombre, salade, œuf de tobiko',
      price: 5.50,
      category_id: 'temaki',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['gluten', 'poisson']
    });
    
    await tryInsertProduct({
      name: 'TEMAKI CREVETTE',
      description: 'Crevette, avocat, concombre, salade, œuf de tobiko',
      price: 5.90,
      category_id: 'temaki',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['crustacés', 'poisson']
    });
    
    await tryInsertProduct({
      name: 'TEMAKI VEGGIE',
      description: 'Salade, concombre, avocat',
      price: 4.90,
      category_id: 'temaki',
      is_vegetarian: true,
      pieces: 1
    });
    
    // Gunkan
    await tryInsertProduct({
      name: 'GUNKAN SAUMON',
      description: 'Gunkan au tartare de saumon',
      price: 5.90,
      category_id: 'gunkan',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'GUNKAN THON',
      description: 'Gunkan au tartare de thon',
      price: 6.50,
      category_id: 'gunkan',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'GUNKAN THON CUIT',
      description: 'Gunkan au thon cuit',
      price: 6.50,
      category_id: 'gunkan',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'GUNKAN ŒUF DE SAUMON',
      description: 'Gunkan aux œufs de saumon',
      price: 6.50,
      category_id: 'gunkan',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'GUNKAN VEGGIE',
      description: 'Cream cheese, concombre, ciboulette, radis, ciboulette',
      price: 5.30,
      category_id: 'gunkan',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['lactose']
    });
    
    // Triangle Sankaku
    await tryInsertProduct({
      name: 'TRIANGLE SANKAKU SAUMON',
      description: 'Triangle sankaku au saumon',
      price: 5.50,
      category_id: 'triangle',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TRIANGLE SANKAKU THON',
      description: 'Triangle sankaku au thon',
      price: 5.90,
      category_id: 'triangle',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TRIANGLE SANKAKU THON CUIT',
      description: 'Triangle sankaku au thon cuit',
      price: 5.90,
      category_id: 'triangle',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TRIANGLE SANKAKU VEGGIE',
      description: 'Triangle sankaku concombre avocat cheese',
      price: 5.50,
      category_id: 'triangle',
      is_vegetarian: true,
      pieces: 1,
      allergens: ['lactose']
    });
    
    // Signature
    await tryInsertProduct({
      name: 'RAINBOW ROLL',
      description: 'Roll sushi avec fines tranches de poisson colorées sur le dessus',
      price: 10.20,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CHEDDAR ROLL',
      description: 'Roll avec du cheddar fondu',
      price: 7.90,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'BRIE TRUFFÉ',
      description: 'Roll avec du brie et un parfum de truffe',
      price: 13.90,
      category_id: 'signature',
      is_vegetarian: true,
      pieces: 6,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'MANGO ROLL',
      description: 'Roll avec de la mangue',
      price: 7.90,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6
    });
    
    await tryInsertProduct({
      name: 'TEMPURA CURRY',
      description: 'Roll tempura avec une saveur curry',
      price: 8.20,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['gluten']
    });
    
    await tryInsertProduct({
      name: 'WHITE ROLL',
      description: 'Roll enrobé de riz blanc',
      price: 8.50,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6
    });
    
    await tryInsertProduct({
      name: 'GREEN SUPREME',
      description: 'Roll gourmet à l\'avocat',
      price: 12.90,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6
    });
    
    await tryInsertProduct({
      name: 'SALMON PREMIUM',
      description: 'Roll premium au saumon',
      price: 10.90,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'GUNKAN SAUMANGO',
      description: 'Gunkan au saumon et à la mangue',
      price: 8.50,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'DONUTS NIGIRI',
      description: 'Nigiri en forme de donuts',
      price: 5.90,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 2
    });
    
    await tryInsertProduct({
      name: 'DAURADO ROLL',
      description: 'Roll à la daurade',
      price: 7.90,
      category_id: 'signature',
      is_vegetarian: false,
      pieces: 6,
      allergens: ['poisson']
    });
    
    // Sashimi & tataki
    await tryInsertProduct({
      name: 'SASHIMI SAUMON',
      description: 'Sashimi de saumon',
      price: 6.30,
      category_id: 'sashimi',
      is_vegetarian: false,
      pieces: 5,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'SASHIMI THON',
      description: 'Sashimi de thon',
      price: 6.90,
      category_id: 'sashimi',
      is_vegetarian: false,
      pieces: 5,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'DUO SASHIMI',
      description: 'Assortiment de sashimi saumon et thon',
      price: 12.50,
      category_id: 'sashimi',
      is_vegetarian: false,
      pieces: 10,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'SAUMON TATAKI',
      description: 'Saumon légèrement snacké',
      price: 6.80,
      category_id: 'sashimi',
      is_vegetarian: false,
      pieces: 5,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'THON TATAKI',
      description: 'Thon légèrement snacké',
      price: 7.40,
      category_id: 'sashimi',
      is_vegetarian: false,
      pieces: 5,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'DUO TATAKI',
      description: 'Assortiment de tataki saumon et thon',
      price: 12.90,
      category_id: 'sashimi',
      is_vegetarian: false,
      pieces: 10,
      allergens: ['poisson']
    });
    
    // Chirashi
    await tryInsertProduct({
      name: 'CHIRASHI SAUMON',
      description: 'Bol de riz vinaigré avec saumon cru',
      price: 15.90,
      category_id: 'chirashi',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CHIRASHI SAUMON AVOCAT',
      description: 'Bol de riz vinaigré avec saumon cru et avocat',
      price: 16.50,
      category_id: 'chirashi',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CHIRASHI SAUMON TATAKI',
      description: 'Bol de riz vinaigré avec saumon tataki',
      price: 16.90,
      category_id: 'chirashi',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CHIRASHI THON AVOCAT',
      description: 'Bol de riz vinaigré avec thon cru et avocat',
      price: 17.50,
      category_id: 'chirashi',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CHIRASHI FRESH FUSION',
      description: 'Bol de riz vinaigré avec assortiment de poissons frais',
      price: 17.50,
      category_id: 'chirashi',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'CHIRASHI FRESH POULET',
      description: 'Bol de riz vinaigré avec poulet',
      price: 16.90,
      category_id: 'chirashi',
      is_vegetarian: false
    });
    
    // Tartare
    await tryInsertProduct({
      name: 'TARTARE SAUMON AVOCAT',
      description: 'Tartare de saumon et avocat',
      price: 14.90,
      category_id: 'tartare',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TARTARE SAUMON MANGUE AVOCAT',
      description: 'Tartare de saumon, mangue et avocat',
      price: 15.90,
      category_id: 'tartare',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TARTARE DORADE MANGUE AVOCAT',
      description: 'Tartare de dorade, mangue et avocat',
      price: 15.90,
      category_id: 'tartare',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TARTARE THON AVOCAT',
      description: 'Tartare de thon et avocat',
      price: 15.90,
      category_id: 'tartare',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    await tryInsertProduct({
      name: 'TARTARE TRIO',
      description: 'Tartare de saumon, thon, daurade et avocat',
      price: 16.90,
      category_id: 'tartare',
      is_vegetarian: false,
      allergens: ['poisson']
    });
    
    // Yakitori & grill
    await tryInsertProduct({
      name: 'YAKITORI BŒUF FROMAGE',
      description: 'Brochettes de bœuf au fromage',
      price: 5.90,
      category_id: 'yakitori',
      is_vegetarian: false,
      pieces: 2,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'YAKITORI POULET',
      description: 'Brochettes de poulet',
      price: 5.90,
      category_id: 'yakitori',
      is_vegetarian: false,
      pieces: 2
    });
    
    await tryInsertProduct({
      name: 'CREVETTE TEMPURA',
      description: 'Crevettes frites en tempura',
      price: 6.40,
      category_id: 'yakitori',
      is_vegetarian: false,
      pieces: 3,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'POULET TEMPURA',
      description: 'Poulet frit en tempura',
      price: 5.90,
      category_id: 'yakitori',
      is_vegetarian: false,
      allergens: ['gluten']
    });
    
    await tryInsertProduct({
      name: 'GYOZA POULET',
      description: 'Raviolis japonais au poulet',
      price: 5.70,
      category_id: 'yakitori',
      is_vegetarian: false,
      pieces: 3,
      allergens: ['gluten']
    });
    
    await tryInsertProduct({
      name: 'GYOZA CREVETTE',
      description: 'Raviolis japonais à la crevette',
      price: 5.90,
      category_id: 'yakitori',
      is_vegetarian: false,
      pieces: 3,
      allergens: ['crustacés', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'GYOZA VEGGIE',
      description: 'Raviolis japonais aux légumes',
      price: 5.50,
      category_id: 'yakitori',
      is_vegetarian: true,
      pieces: 3,
      allergens: ['gluten']
    });
    
    // Accompagnements
    await tryInsertProduct({
      name: 'EDAMAME',
      description: 'Fèves de soja',
      price: 4.70,
      category_id: 'accompagnements',
      is_vegetarian: true,
      allergens: ['soja']
    });
    
    await tryInsertProduct({
      name: 'SALADE DE CHOU',
      description: 'Salade de chou japonaise',
      price: 3.40,
      category_id: 'accompagnements',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'SALADE WAKAME',
      description: 'Salade d\'algues',
      price: 4.90,
      category_id: 'accompagnements',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'SOUPE MISO',
      description: 'Soupe traditionnelle japonaise au miso',
      price: 3.20,
      category_id: 'accompagnements',
      is_vegetarian: true,
      allergens: ['soja']
    });
    
    await tryInsertProduct({
      name: 'RIZ NATURE',
      description: 'Riz blanc japonais',
      price: 2.70,
      category_id: 'accompagnements',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'RIZ VINAIGRÉ',
      description: 'Riz japonais assaisonné au vinaigre de riz',
      price: 3.20,
      category_id: 'accompagnements',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'ROULEAU DE PRINTEMPS',
      description: 'Rouleau de printemps aux légumes frais',
      price: 7.50,
      category_id: 'accompagnements',
      is_vegetarian: true
    });
    
    // Desserts
    await tryInsertProduct({
      name: 'CALIFORNIA BANANE NUTELLA',
      description: 'California roll sucré à la banane et nutella',
      price: 4.50,
      category_id: 'desserts',
      is_vegetarian: true,
      is_best_seller: true,
      pieces: 8,
      allergens: ['fruits à coque', 'lactose']
    });
    
    await tryInsertProduct({
      name: 'PERLE DE COCO',
      description: 'Dessert asiatique à la noix de coco',
      price: 4.90,
      category_id: 'desserts',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['fruits à coque']
    });
    
    await tryInsertProduct({
      name: 'CHEESECAKE YUZU',
      description: 'Cheesecake parfumé au yuzu',
      price: 4.90,
      category_id: 'desserts',
      is_vegetarian: true,
      allergens: ['lactose', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'FONDANT CHOCOLAT',
      description: 'Fondant au chocolat',
      price: 4.90,
      category_id: 'desserts',
      is_vegetarian: true,
      allergens: ['lactose', 'gluten']
    });
    
    await tryInsertProduct({
      name: 'MANGO STICKY RICE',
      description: 'Riz gluant à la mangue',
      price: 7.50,
      category_id: 'desserts',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'PERLE DU JAPON MANGUE',
      description: 'Perles de tapioca à la mangue',
      price: 5.50,
      category_id: 'desserts',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'PERLE DU JAPON ANANAS',
      description: 'Perles de tapioca à l\'ananas',
      price: 5.50,
      category_id: 'desserts',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'PERLE DU JAPON BANANE',
      description: 'Perles de tapioca à la banane',
      price: 5.50,
      category_id: 'desserts',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'SALADE DE LITCHI',
      description: 'Salade de litchis frais',
      price: 4.90,
      category_id: 'desserts',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'COCKTAIL DE FRUITS',
      description: 'Mélange de fruits frais',
      price: 5.50,
      category_id: 'desserts',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'MOCHI VANILLE',
      description: 'Mochi à la vanille',
      price: 5.20,
      category_id: 'desserts',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'MOCHI MANGUE PASSION',
      description: 'Mochi à la mangue et fruit de la passion',
      price: 5.20,
      category_id: 'desserts',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'MOCHI FLEUR DE CERISIER',
      description: 'Mochi à la fleur de cerisier',
      price: 5.20,
      category_id: 'desserts',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'MOCHI CITRON',
      description: 'Mochi au citron',
      price: 5.20,
      category_id: 'desserts',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['lactose']
    });
    
    await tryInsertProduct({
      name: 'MOCHI MATCHA',
      description: 'Mochi au thé vert matcha',
      price: 5.20,
      category_id: 'desserts',
      is_vegetarian: true,
      pieces: 2,
      allergens: ['lactose']
    });
    
    // Boissons
    await tryInsertProduct({
      name: 'EAU PLATE',
      description: 'Eau plate 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'EAU GAZEUSE',
      description: 'Eau gazeuse 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'COCA-COLA',
      description: 'Coca-Cola 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'COCA-COLA ZERO',
      description: 'Coca-Cola Zero 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'COCA-COLA CHERRY',
      description: 'Coca-Cola Cherry 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'ORANGINA',
      description: 'Orangina 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'FUZETEA THÉ NOIR PÊCHE',
      description: 'Fuzetea thé noir pêche 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'FUZETEA THÉ VERT CITRON',
      description: 'Fuzetea thé vert citron 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'OASIS TROPICAL',
      description: 'Oasis Tropical 33cl',
      price: 2.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'MANGAJO THÉ VERT & BAIE D\'AÇAIE',
      description: 'Mangajo thé vert & baie d\'açaie 25cl',
      price: 3.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'MANGAJO CITRON & THÉ VERT',
      description: 'Mangajo citron & thé vert 25cl',
      price: 3.50,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'GINGER BEER',
      description: 'Ginger Beer 27,5cl',
      price: 3.90,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'LIMONADE JAPONAISE LITCHI',
      description: 'Limonade japonaise au litchi 22cl',
      price: 3.50,
      category_id: 'boissons',
      is_vegetarian: true,
      is_new: true
    });
    
    await tryInsertProduct({
      name: 'KIRIN ICHIBAN',
      description: 'Bière japonaise Kirin Ichiban 33cl',
      price: 4.00,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    await tryInsertProduct({
      name: 'CAFÉ',
      description: 'Café',
      price: 2.00,
      category_id: 'boissons',
      is_vegetarian: true
    });
    
    return true;
  } catch (error) {
    console.error("Error initializing all products:", error);
    return false;
  }
};

// Helper function to try inserting a product, skipping if it already exists
const tryInsertProduct = async (product: {
  name: string;
  description?: string | null;
  price: number;
  category_id: string;
  image_url?: string | null;
  is_vegetarian?: boolean | null;
  is_spicy?: boolean | null;
  is_new?: boolean | null;
  is_best_seller?: boolean | null;
  allergens?: string[] | null;
  pieces?: number | null;
}) => {
  try {
    // Check if product already exists
    const exists = await productExistsInCategory(product.name, product.category_id);
    if (exists) {
      console.log(`Product ${product.name} already exists in category ${product.category_id}, skipping...`);
      return null;
    }
    
    // Insert the new product
    return await insertProduct(product);
  } catch (error) {
    console.error(`Error inserting product ${product.name}:`, error);
    return null;
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
