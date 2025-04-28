
import { supabase, fetchCategories, fetchProductsByCategory, insertCategory, insertProduct, productExistsInCategory, fetchAllMenuData } from "@/integrations/supabase/client";
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
    // Utiliser la nouvelle fonction qui charge tout en une seule requête
    return await fetchAllMenuData();
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
      description: 'Poulet tempura, avocat, concombre, salade',
      price: 5.50,
      category_id: 'temaki',
      is_vegetarian: false,
      pieces: 1,
      allergens: ['gluten']
    });
    
    return true;
  } catch (error) {
    console.error("Error initializing menu:", error);
    return false;
  }
};

// Helper function to try inserting a product after checking if it exists
const tryInsertProduct = async (productData: any) => {
  try {
    // Check if the product already exists
    const exists = await productExistsInCategory(productData.name, productData.category_id);
    
    if (!exists) {
      // Insert the product if it doesn't exist
      await insertProduct(productData);
    }
    
    return true;
  } catch (error) {
    console.error(`Error inserting product ${productData.name}:`, error);
    return false;
  }
};
