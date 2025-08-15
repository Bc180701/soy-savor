import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CookiePreferences {
  essential: boolean;
  performance: boolean;
  marketing: boolean;
}

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Toujours activé
    performance: false,
    marketing: false,
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait un choix
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      // Délai pour laisser la page se charger
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Charger les préférences sauvegardées
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(savedPreferences);
        applyCookiePreferences(savedPreferences);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences cookies:', error);
      }
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Appliquer les cookies selon les préférences
    if (prefs.performance) {
      // Activer les cookies de performance (Analytics, etc.)
      console.log('Cookies de performance activés');
      // Ici vous pourriez activer Google Analytics, etc.
    }

    if (prefs.marketing) {
      // Activer les cookies marketing
      console.log('Cookies marketing activés');
      // Ici vous pourriez activer les pixels de tracking, etc.
    }
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    applyCookiePreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      performance: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const acceptEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      performance: false,
      marketing: false,
    };
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Les cookies essentiels ne peuvent pas être désactivés
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4"
          >
            <Card className="mx-auto max-w-4xl p-6 bg-background/95 backdrop-blur-sm border-primary/20">
              <div className="flex items-start gap-4">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Nous utilisons des cookies
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nous utilisons des cookies essentiels pour le fonctionnement du site, 
                    ainsi que des cookies de performance et marketing pour améliorer votre expérience. 
                    Vous pouvez choisir quels cookies accepter.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={acceptAll} className="bg-primary hover:bg-primary/90">
                      Tout accepter
                    </Button>
                    <Button 
                      onClick={acceptEssential} 
                      variant="outline"
                    >
                      Cookies essentiels seulement
                    </Button>
                    <Button 
                      onClick={() => setShowSettings(true)} 
                      variant="ghost"
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Personnaliser
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    En continuant, vous acceptez notre{" "}
                    <a href="/politique-confidentialite" className="text-primary hover:underline">
                      politique de confidentialité
                    </a>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={acceptEssential}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres des cookies
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">Cookies essentiels</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nécessaires au fonctionnement du site (authentification, panier, session). 
                    Ces cookies ne peuvent pas être désactivés.
                  </p>
                </div>
                <Switch 
                  checked={preferences.essential} 
                  disabled
                  className="ml-4"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">Cookies de performance</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collectent des informations anonymes sur l'utilisation du site 
                    pour nous aider à l'améliorer (pages visitées, temps passé, erreurs).
                  </p>
                </div>
                <Switch 
                  checked={preferences.performance}
                  onCheckedChange={() => togglePreference('performance')}
                  className="ml-4"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">Cookies marketing</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Utilisés pour afficher des publicités pertinentes et mesurer 
                    l'efficacité de nos campagnes marketing.
                  </p>
                </div>
                <Switch 
                  checked={preferences.marketing}
                  onCheckedChange={() => togglePreference('marketing')}
                  className="ml-4"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Données collectées :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Informations de compte (nom, email, téléphone)</li>
                <li>• Adresses de livraison</li>
                <li>• Historique des commandes</li>
                <li>• Préférences alimentaires et allergies</li>
                <li>• Données de navigation et d'utilisation</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Consultez notre{" "}
                <a href="/politique-confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </a>{" "}
                pour plus d'informations.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Annuler
              </Button>
              <Button onClick={saveCustomPreferences}>
                Enregistrer les préférences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;