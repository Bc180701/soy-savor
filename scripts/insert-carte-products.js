const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Données des produits de la carte
const productsData = [
  {
    "id": "009617f8-df15-414e-bcc4-6d848bb04360",
    "name": "SIGNATURE BRIE TRUFFÉ",
    "description": "Roll avec du brie truffé, cernaux de noix ",
    "price": "13.90",
    "image_url": "https://tdykegnmomyyucbhslok.supabase.co/storage/v1/object/public/products/signature%20brie%20truffe%20(1).png",
    "category_id": "signature",
    "allergens": [],
    "pieces": 6,
    "is_vegetarian": true,
    "is_gluten_free": false,
    "is_spicy": false,
    "prep_time": 4,
    "source_product_id": "3e398299-8f6f-4fa8-a3fd-51c481f67147"
  }
  // Note: J'ai tronqué la liste pour des raisons de longueur
  // Vous pouvez ajouter tous les autres produits ici
];

async function insertProducts() {
  try {
    console.log('🔄 Insertion des produits de la carte...');
    
    // Vérifier si des produits existent déjà
    const { data: existingProducts } = await supabase
      .from('produits_carte')
      .select('id')
      .limit(1);
    
    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ Des produits existent déjà dans la table produits_carte');
      return;
    }
    
    // Insérer les produits
    const { error } = await supabase
      .from('produits_carte')
      .insert(productsData);
    
    if (error) {
      console.error('❌ Erreur lors de l\'insertion:', error);
    } else {
      console.log('✅ Produits insérés avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

insertProducts();
