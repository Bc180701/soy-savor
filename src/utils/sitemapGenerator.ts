// Générateur de sitemap XML automatique
interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const generateSitemap = (): string => {
  const baseUrl = 'https://preview--soy-savor.lovable.app';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urls: SitemapUrl[] = [
    // Pages principales - priorité maximale
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/menu`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/commander`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    
    // Pages de création
    {
      loc: `${baseUrl}/composer-sushi`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/composer-poke`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/nos-restaurants`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/mentions-legales`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3
    },

    // Pages géographiques principales - Haute priorité SEO local
    {
      loc: `${baseUrl}/livraison-sushi-chateaurenard`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/livraison-sushi-saint-martin-de-crau`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/restaurant-japonais-bouches-du-rhone`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },

    // Pages par villes - Zone Châteaurenard
    {
      loc: `${baseUrl}/livraison-sushi-eyragues`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-barbentane`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-graveson`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-maillane`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-noves`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-rognonas`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-saint-remy-de-provence`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },

    // Pages par villes - Zone Saint-Martin-de-Crau
    {
      loc: `${baseUrl}/livraison-sushi-paradou`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-maussane-les-alpilles`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-mouries`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-pont-de-crau`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-raphele-les-arles`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-moules`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/livraison-sushi-mas-thibert`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },

    // Pages par codes postaux - SEO technique
    {
      loc: `${baseUrl}/sushi-13160`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13310`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13630`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13570`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13690`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13910`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13550`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13870`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13210`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13520`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13890`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13200`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13280`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/sushi-13104`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    }
  ];

  // Génération du XML
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlEntries = urls.map(url => 
    `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  ).join('\n');

  return `${xmlHeader}\n${urlsetOpen}\n${urlEntries}\n${urlsetClose}`;
};

export const downloadSitemap = () => {
  const sitemapContent = generateSitemap();
  const blob = new Blob([sitemapContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};