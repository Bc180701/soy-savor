import { useState, useEffect } from 'react';
import { BluetoothLe, BleDevice } from '@capacitor-community/bluetooth-le';
import { useToast } from '@/hooks/use-toast';

export const useBluetooth = () => {
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BleDevice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialiser le Bluetooth
    const initBluetooth = async () => {
      try {
        await BluetoothLe.initialize();
        console.log('✅ Bluetooth initialisé');
      } catch (error) {
        console.error('❌ Erreur initialisation Bluetooth:', error);
        toast({
          title: "Erreur Bluetooth",
          description: "Impossible d'initialiser le Bluetooth",
          variant: "destructive"
        });
      }
    };

    initBluetooth();
  }, [toast]);

  const startScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);

      // Démarrer le scan
      await BluetoothLe.requestLEScan({
        allowDuplicates: false
      });
      // Écouter les résultats du scan
      BluetoothLe.addListener('onScanResult', (result) => {
        console.log('📱 Appareil trouvé:', result);
        setDevices(prev => {
          const exists = prev.find(d => d.deviceId === result.device.deviceId);
          if (!exists) {
            return [...prev, result.device];
          }
          return prev;
        });
      });

      // Arrêter le scan après 10 secondes
      setTimeout(() => {
        stopScan();
      }, 10000);

      toast({
        title: "Recherche d'appareils",
        description: "Recherche d'appareils Bluetooth en cours..."
      });

    } catch (error) {
      console.error('❌ Erreur scan:', error);
      setIsScanning(false);
      toast({
        title: "Erreur de scan",
        description: "Impossible de scanner les appareils Bluetooth",
        variant: "destructive"
      });
    }
  };

  const stopScan = async () => {
    try {
      await BluetoothLe.stopLEScan();
      setIsScanning(false);
      console.log('⏹️ Scan arrêté');
    } catch (error) {
      console.error('❌ Erreur arrêt scan:', error);
    }
  };

  const connectToDevice = async (device: BleDevice) => {
    try {
      console.log('🔗 Connexion à:', device.name || device.deviceId);
      
      await BluetoothLe.connect({ deviceId: device.deviceId });
      setConnectedDevice(device);
      
      toast({
        title: "Connexion réussie",
        description: `Connecté à ${device.name || device.deviceId}`
      });

      console.log('✅ Connecté à:', device.name || device.deviceId);
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à l'appareil",
        variant: "destructive"
      });
    }
  };

  const disconnect = async () => {
    if (!connectedDevice) return;

    try {
      await BluetoothLe.disconnect({ deviceId: connectedDevice.deviceId });
      setConnectedDevice(null);
      
      toast({
        title: "Déconnecté",
        description: "Appareil déconnecté"
      });

      console.log('🔌 Déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  return {
    devices,
    isScanning,
    connectedDevice,
    startScan,
    stopScan,
    connectToDevice,
    disconnect
  };
};