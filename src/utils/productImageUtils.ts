/**
 * Génère une URL d'image pour un produit avec le nom du produit intégré
 */
export const generateProductImageUrl = (productName: string, originalUrl?: string): string => {
  if (!originalUrl || originalUrl === "/placeholder.svg") {
    // Utiliser une image par défaut avec le nom du produit
    return `https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?q=80&w=1000&auto=format&fit=crop&url=${encodeURIComponent(productName)}`;
  }
  
  // Si c'est une URL Supabase, garder l'URL complète mais ajouter le paramètre url
  if (originalUrl.includes('supabase.co/storage/v1/object/public/')) {
    // Séparer l'URL de base et les paramètres existants
    const [baseUrl, existingParams] = originalUrl.split('?');
    const newUrl = new URL(baseUrl);
    newUrl.searchParams.set('url', productName);
    
    // Ajouter les paramètres existants s'il y en a
    if (existingParams) {
      const existingUrlParams = new URLSearchParams(existingParams);
      existingUrlParams.forEach((value, key) => {
        if (key !== 'url') {
          newUrl.searchParams.set(key, value);
        }
      });
    }
    
    return newUrl.toString();
  }
  
  // Pour les URLs externes, ajouter le paramètre url si pas présent
  if (originalUrl.startsWith('http')) {
    const url = new URL(originalUrl);
    if (!url.searchParams.has('url')) {
      url.searchParams.set('url', productName);
    }
    return url.toString();
  }
  
  // Pour les noms de fichiers simples
  return `${originalUrl}?url=${encodeURIComponent(productName)}`;
};

/**
 * Génère le texte alternatif pour l'image d'un produit
 */
export const generateProductImageAlt = (productName: string): string => {
  return `${productName} Sushieats`;
};