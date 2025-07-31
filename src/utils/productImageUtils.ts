/**
 * Génère une URL d'image Unsplash pour un produit avec le nom du produit intégré
 */
export const generateProductImageUrl = (productName: string, originalUrl?: string): string => {
  if (!originalUrl || originalUrl === "/placeholder.svg") {
    // Utiliser une image par défaut avec le nom du produit
    return `https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?q=80&w=1000&auto=format&fit=crop&url=${encodeURIComponent(productName)}`;
  }
  
  // Si l'URL existe déjà, vérifier si elle contient déjà le paramètre url
  const url = new URL(originalUrl);
  if (!url.searchParams.has('url')) {
    url.searchParams.set('url', productName);
  }
  
  return url.toString();
};

/**
 * Génère le texte alternatif pour l'image d'un produit
 */
export const generateProductImageAlt = (productName: string): string => {
  return `${productName} Sushieats`;
};