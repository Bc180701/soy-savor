import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Smartphone, Download } from "lucide-react";
import { isPWAInstalled, isIOSSafari, getPWAInstallPrompt, isIOSVersion16Plus } from "@/utils/pwaDetection";

export const PWAInstallGuide = () => {
  // Ne pas afficher si déjà installé
  if (isPWAInstalled()) {
    return null;
  }

  // Affichage spécifique pour iOS
  if (isIOSSafari()) {
    const isCompatible = isIOSVersion16Plus();
    
    return (
      <Alert className="mb-4">
        <Smartphone className="h-4 w-4" />
        <AlertTitle>📱 Installation requise (iOS)</AlertTitle>
        <AlertDescription className="whitespace-pre-line text-sm">
          {getPWAInstallPrompt()}
          {!isCompatible && (
            <div className="mt-2 text-amber-600">
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
