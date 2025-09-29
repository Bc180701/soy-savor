import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bluetooth, BluetoothConnected } from "lucide-react";
import { useBluetooth } from "@/hooks/useBluetooth";

export const BluetoothManager = () => {
  const { 
    devices, 
    isScanning, 
    connectedDevice, 
    startScan, 
    stopScan, 
    connectToDevice, 
    disconnect 
  } = useBluetooth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            Gestionnaire Bluetooth
          </CardTitle>
          <CardDescription>
            Gérer les connexions Bluetooth pour les imprimantes et autres appareils
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* État de connexion */}
          {connectedDevice && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <BluetoothConnected className="h-5 w-5 text-green-600" />
                <span className="font-medium">
                  Connecté à: {connectedDevice.name || connectedDevice.deviceId}
                </span>
              </div>
              <Button variant="outline" onClick={disconnect} size="sm">
                Déconnecter
              </Button>
            </div>
          )}

          {/* Contrôles de scan */}
          <div className="flex gap-2">
            <Button 
              onClick={isScanning ? stopScan : startScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning && <Loader2 className="h-4 w-4 animate-spin" />}
              {isScanning ? 'Arrêter le scan' : 'Scanner les appareils'}
            </Button>
          </div>

          {/* Liste des appareils */}
          <div className="space-y-2">
            <h4 className="font-medium">Appareils trouvés ({devices.length})</h4>
            {devices.length === 0 && !isScanning && (
              <p className="text-muted-foreground text-sm">
                Aucun appareil trouvé. Lancez un scan pour rechercher des appareils.
              </p>
            )}
            {devices.map((device) => (
              <div 
                key={device.deviceId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {device.name || 'Appareil inconnu'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {device.deviceId}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => connectToDevice(device)}
                  disabled={connectedDevice?.deviceId === device.deviceId}
                >
                  {connectedDevice?.deviceId === device.deviceId ? 'Connecté' : 'Connecter'}
                </Button>
              </div>
            ))}
          </div>

          {isScanning && (
            <div className="text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Recherche d'appareils en cours...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};