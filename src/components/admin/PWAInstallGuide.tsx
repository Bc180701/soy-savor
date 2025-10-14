import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Smartphone, Download } from "lucide-react";
import { isPWAInstalled, isIOSSafari, getPWAInstallPrompt, isIOSVersion16Plus } from "@/utils/pwaDetection";

export const PWAInstallGuide = () => {
  const isInstalled = isPWAInstalled();
  const isIOS = isIOSSafari();
  const isIOSCompatible = isIOSVersion16Plus();
  
  // Ne pas afficher si déjà installé
  if (isInstalled) {
    return null;
  }

  // Affichage spécifique pour iOS non installé
  if (isIOS) {
    return (
      <Alert className="mb-4 border-orange-500 bg-orange-50">
        <Smartphone className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">📱 Installation OBLIGATOIRE pour iOS</AlertTitle>
        <AlertDescription className="whitespace-pre-line text-sm text-orange-800">
          {getPWAInstallPrompt()}
          <div className="mt-2 font-semibold">
            🔔 Les notifications push ne fonctionneront qu'après installation !
          </div>
          {!isIOSCompatible && (
            <div className="mt-2 text-red-600 font-semibold">
              ⚠️ iOS 16.4+ requis pour les notifications push
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Affichage pour les autres navigateurs
  return (
    <Alert className="mb-4">
      <Download className="h-4 w-4" />
      <AlertTitle>💡 Installez l'application</AlertTitle>
      <AlertDescription>
        {getPWAInstallPrompt()}
      </AlertDescription>
    </Alert>
  );
};
