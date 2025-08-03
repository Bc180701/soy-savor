import { generateSitemap } from "@/utils/sitemapGenerator";

// Route pour servir le sitemap.xml
export const SitemapRoute = () => {
  // Générer le sitemap XML
  const sitemapXml = generateSitemap();
  
  // Retourner une réponse XML
  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400', // Cache 24h
    },
  });
};