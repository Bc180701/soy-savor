import { Button } from "@/components/ui/button";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface PushNotificationToggleProps {
  restaurantId: string | null;
}

export const PushNotificationToggle = ({ restaurantId }: PushNotificationToggleProps) => {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    isLoading, 
    error, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications(restaurantId);

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Les notifications push ne sont pas supportées sur ce navigateur.
              Utilisez Chrome, Edge, Firefox ou Safari iOS 16.4+.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!restaurantId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Veuillez sélectionner un restaurant pour activer les notifications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold">Notifications Push</h3>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed 
                    ? "✅ Activées - Vous recevrez les notifications de nouvelles commandes"
                    : "❌ Désactivées - Activez pour recevoir les alertes de commandes"
                  }
                </p>
              </div>
            </div>

            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isLoading || permission === 'denied'}
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
            >
              {isLoading 
                ? "Chargement..." 
                : isSubscribed 
                  ? "Désactiver" 
                  : "Activer"
              }
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {permission === 'denied' && (
            <Alert>
              <AlertDescription>
                ⚠️ Vous avez bloqué les notifications. Pour les activer :
                <br />
                1. Cliquez sur l'icône de cadenas dans la barre d'adresse
                <br />
                2. Autorisez les notifications
                <br />
                3. Rechargez la page
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
