import { generateSitemap, downloadSitemap } from "@/utils/sitemapGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Search } from "lucide-react";

const SitemapManager = () => {
  const handlePreviewSitemap = () => {
    const sitemapContent = generateSitemap();
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<pre>${sitemapContent}</pre>`);
      newWindow.document.title = "Aperçu Sitemap XML";
    }
  };

  const copyToClipboard = () => {
    const sitemapContent = generateSitemap();
    navigator.clipboard.writeText(sitemapContent);
    alert("Sitemap copié dans le presse-papiers !");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Sitemap XML Automatique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">Pages principales</h3>
            <Badge variant="secondary" className="bg-green-100">8 pages</Badge>
            <p className="text-sm text-green-600 mt-2">Menu, Commander, Contact...</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Pages géographiques</h3>
            <Badge variant="secondary" className="bg-blue-100">17 villes</Badge>
            <p className="text-sm text-blue-600 mt-2">Toutes vos zones de livraison</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">Codes postaux</h3>
            <Badge variant="secondary" className="bg-purple-100">14 codes</Badge>
            <p className="text-sm text-purple-600 mt-2">SEO par code postal</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">✅ Avantages du sitemap automatique :</h4>
          <ul className="text-sm space-y-1">
            <li>• 🚀 Indexation plus rapide sur Google</li>
            <li>• 📍 Découverte automatique des pages géographiques</li>
            <li>• 🔄 Mise à jour automatique des dates</li>
            <li>• ⚡ Priorités SEO optimisées par type de page</li>
            <li>• 📊 Signal positif pour Google Search Console</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={downloadSitemap} className="bg-gold-600 hover:bg-gold-700">
            <Download className="w-4 h-4 mr-2" />
            Télécharger sitemap.xml
          </Button>
          
          <Button variant="outline" onClick={handlePreviewSitemap}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Prévisualiser
          </Button>
          
          <Button variant="outline" onClick={copyToClipboard}>
            Copier le XML
          </Button>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">📤 Prochaines étapes :</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Télécharger le sitemap.xml ci-dessus</li>
            <li>2. L'uploader à la racine de votre serveur web</li>
            <li>3. Ajouter l'URL dans Google Search Console</li>
            <li>4. Surveiller l'indexation des pages géographiques</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SitemapManager;