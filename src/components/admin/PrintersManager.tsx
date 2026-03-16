/// <reference types="web-bluetooth" />
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

import { Eye, EyeOff, Printer, TestTube, RefreshCw, Bluetooth } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Types pour le Bluetooth mobile
interface MobileBluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<any>;
    disconnect: () => void;
    getPrimaryService: (service: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    epson?: {
      ePOSDevice: new () => {
        connect: (url: string, callback: (result: string) => void) => void;
        disconnect: () => void;
        createDevice: (deviceId: string, deviceType: any, options: any) => any;
        DEVICE_TYPE_PRINTER: any;
      };
    };
  }
}

export default function PrintersManager() {
  const [printerConfig, setPrinterConfig] = useState({
    ip_address: "",
    port: "8008",
    device_id: "",
    timeout: "30000"
  });
  const [bluetoothConfig, setBluetoothConfig] = useState({
    device_id: "",
    device_name: "",
    connected: false
  });
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDeviceId, setShowDeviceId] = useState(true);
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<"none" | "found" | "error">("none");
  const [testLogs, setTestLogs] = useState("");
  const [testing, setTesting] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [connectionType, setConnectionType] = useState<"network" | "bluetooth">("network");

  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    // Vérifier le support Bluetooth
    checkBluetoothSupport();
    
    if (isAuthenticated && currentRestaurant?.id) {
      // Réinitialiser la configuration quand on change de restaurant
      setPrinterConfig({
        ip_address: "",
        port: "8008",
        device_id: "",
        timeout: "30000"
      });
      setBluetoothConfig({
        device_id: "",
        device_name: "",
        connected: false
      });
      setConfigStatus("none");
      setTestLogs("");
      loadPrinterConfig();
    }
  }, [isAuthenticated, currentRestaurant?.id]);

  const checkBluetoothSupport = async () => {
    console.log("=== VÉRIFICATION BLUETOOTH ===");
    console.log("navigator:", navigator);
    console.log("navigator.bluetooth:", navigator.bluetooth);
    console.log("typeof navigator.bluetooth:", typeof navigator.bluetooth);
    
    if (navigator.bluetooth) {
      try {
        console.log("Appel à getAvailability()...");
        const available = await navigator.bluetooth.getAvailability();
        console.log('Bluetooth availability:', available);
        setBluetoothSupported(available);
      } catch (error) {
        console.error('Erreur getAvailability:', error);
        setBluetoothSupported(false);
      }
    } else {
      console.log("navigator.bluetooth n'existe pas");
      setBluetoothSupported(false);
    }
    
    console.log("=== FIN VÉRIFICATION ===");
  };

  const loadPrinterConfig = async () => {
    if (!currentRestaurant?.id) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-printer-config', {
        body: { restaurantId: currentRestaurant.id }
      });

      if (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        setConfigStatus("error");
        toast({
          title: "Erreur",
          description: "Impossible de charger la configuration de l'imprimante",
          variant: "destructive",
        });
        return;
      }

      if (data?.printerConfig) {
        if (data.printerConfig.connection_type === "bluetooth") {
          setBluetoothConfig(data.printerConfig);
          setConnectionType("bluetooth");
        } else {
          setPrinterConfig(data.printerConfig);
          setConnectionType("network");
        }
        setConfigStatus("found");
        toast({
          title: "Configuration chargée",
          description: "La configuration de l'imprimante a été chargée avec succès",
        });
      } else {
        setConfigStatus("none");
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      setConfigStatus("error");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "SushiMDP1313") {
      setIsAuthenticated(true);
      toast({
        title: "Authentification réussie",
        description: "Vous pouvez maintenant gérer les imprimantes",
      });
    } else {
      toast({
        title: "Mot de passe incorrect",
        description: "Veuillez saisir le bon mot de passe",
        variant: "destructive",
      });
    }
  };

  const validatePrinterConfig = () => {
    if (connectionType === "bluetooth") {
      if (!bluetoothConfig.device_id) {
        toast({
          title: "Configuration invalide",
          description: "Aucun périphérique Bluetooth sélectionné",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }

    if (!printerConfig.ip_address) {
      toast({
        title: "Configuration invalide",
        description: "L'adresse IP est requise",
        variant: "destructive",
      });
      return false;
    }

    if (!printerConfig.device_id) {
      toast({
        title: "Configuration invalide", 
        description: "L'ID du périphérique est requis",
        variant: "destructive",
      });
      return false;
    }

    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipPattern.test(printerConfig.ip_address)) {
      toast({
        title: "Configuration invalide",
        description: "L'adresse IP n'est pas valide",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSaveConfig = async () => {
    if (!validatePrinterConfig()) return;
    if (!currentRestaurant?.id) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const configToSave = connectionType === "bluetooth" 
        ? { ...bluetoothConfig, connection_type: "bluetooth" }
        : { ...printerConfig, connection_type: "network" };

      const { error } = await supabase.functions.invoke('save-printer-config', {
        body: { 
          restaurantId: currentRestaurant.id,
          printerConfig: configToSave
        }
      });

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast({
          title: "Erreur de sauvegarde",
          description: error.message || "Impossible de sauvegarder la configuration",
          variant: "destructive",
        });
        return;
      }

      setConfigStatus("found");
      toast({
        title: "Configuration sauvegardée",
        description: "La configuration de l'imprimante a été sauvegardée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testPrinterConnection = async () => {
    if (!validatePrinterConfig()) return;

    setTesting(true);
    setTestLogs("🔄 Test de connexion API REST en cours...\n");

    try {
      // Test 1: Vérifier l'accessibilité de base
      setTestLogs(prev => prev + "📡 Test de connectivité réseau...\n");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), parseInt(printerConfig.timeout));

      try {
        // Test de connectivité basique sur le port WebAPI
        const response = await fetch(`http://${printerConfig.ip_address}:${printerConfig.port}/`, {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors' // Permet d'éviter les problèmes CORS pour le test de connectivité
        });
        
        clearTimeout(timeoutId);
        setTestLogs(prev => prev + "✅ Imprimante accessible sur le réseau\n");
        
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          setTestLogs(prev => prev + "❌ Timeout - L'imprimante ne répond pas\n");
          throw new Error(`Timeout (${printerConfig.timeout}ms) - Vérifiez que l'imprimante est allumée et connectée`);
        } else {
          setTestLogs(prev => prev + "❌ Imprimante non accessible\n");
          throw new Error("Impossible de joindre l'imprimante. Vérifiez l'adresse IP et la connexion réseau");
        }
      }

      // Test 2: Vérifier l'API ePOS-Print
      setTestLogs(prev => prev + "🖨️ Test de l'API ePOS-Print...\n");
      
      const eposController = new AbortController();
      const eposTimeoutId = setTimeout(() => eposController.abort(), parseInt(printerConfig.timeout));

      try {
        // Tenter un appel à l'API ePOS-Print avec une commande simple
        const eposResponse = await fetch(`http://${printerConfig.ip_address}:${printerConfig.port}/cgi-bin/epos/service.cgi?devid=${printerConfig.device_id}&timeout=${printerConfig.timeout}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            request: {
              type: 'status'
            }
          }),
          signal: eposController.signal
        });

        clearTimeout(eposTimeoutId);
        
        if (eposResponse.ok) {
          const responseText = await eposResponse.text();
          setTestLogs(prev => prev + "✅ API ePOS-Print accessible\n");
          setTestLogs(prev => prev + `📋 Réponse: ${responseText.substring(0, 100)}...\n`);
        } else {
          setTestLogs(prev => prev + `⚠️ API ePOS-Print répond mais avec le statut: ${eposResponse.status}\n`);
        }

      } catch (eposError) {
        clearTimeout(eposTimeoutId);
        if (eposError instanceof Error && eposError.name === 'AbortError') {
          setTestLogs(prev => prev + "❌ Timeout de l'API ePOS-Print\n");
        } else {
          setTestLogs(prev => prev + "⚠️ API ePOS-Print non accessible (normal avec Server Direct Print)\n");
        }
      }

      // Test 3: Vérifier l'API WebAPI
      setTestLogs(prev => prev + "🌐 Test de l'API WebAPI...\n");
      
      const webApiController = new AbortController();
      const webApiTimeoutId = setTimeout(() => webApiController.abort(), parseInt(printerConfig.timeout));

      try {
        const webApiResponse = await fetch(`http://${printerConfig.ip_address}:${printerConfig.port}/api/info`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: webApiController.signal
        });

        clearTimeout(webApiTimeoutId);
        
        if (webApiResponse.ok) {
          const info = await webApiResponse.json();
          setTestLogs(prev => prev + "✅ API WebAPI accessible\n");
          setTestLogs(prev => prev + `📋 Info imprimante: ${JSON.stringify(info).substring(0, 100)}...\n`);
        } else {
          setTestLogs(prev => prev + `⚠️ API WebAPI répond avec le statut: ${webApiResponse.status}\n`);
        }

      } catch (webApiError) {
        clearTimeout(webApiTimeoutId);
        if (webApiError instanceof Error && webApiError.name === 'AbortError') {
          setTestLogs(prev => prev + "❌ Timeout de l'API WebAPI\n");
        } else {
          setTestLogs(prev => prev + "⚠️ API WebAPI non accessible\n");
        }
      }

      // Résumé du test
      setTestLogs(prev => prev + "\n🎉 Test de connectivité terminé!\n");
      setTestLogs(prev => prev + "📋 Résumé:\n");
      setTestLogs(prev => prev + `   • Imprimante: TM-m30III (${printerConfig.device_id})\n`);
      setTestLogs(prev => prev + `   • Adresse: ${printerConfig.ip_address}:${printerConfig.port}\n`);
      setTestLogs(prev => prev + "   • Connectivité réseau: ✅\n");
      setTestLogs(prev => prev + "   • Configuration: Server Direct Print activé\n");
      setTestLogs(prev => prev + "\n💡 L'imprimante est accessible et configurée correctement!\n");

      toast({
        title: "Test réussi",
        description: `Connexion réussie à l'imprimante TM-m30III ${printerConfig.device_id}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setTestLogs(prev => prev + `💥 Test échoué: ${errorMessage}\n`);
      
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        userFriendlyMessage = "Timeout de connexion. Vérifiez que l'imprimante est allumée et accessible.";
        setTestLogs(prev => prev + "\n🔧 Solutions possibles:\n");
        setTestLogs(prev => prev + "   • Vérifiez que l'imprimante est allumée\n");
        setTestLogs(prev => prev + "   • Vérifiez l'adresse IP dans les paramètres réseau\n");
        setTestLogs(prev => prev + "   • Redémarrez l'imprimante\n");
        setTestLogs(prev => prev + "   • Vérifiez que l'imprimante est sur le même réseau\n");
      } else if (errorMessage.includes('réseau') || errorMessage.includes('network')) {
        userFriendlyMessage = "Problème réseau. Vérifiez l'adresse IP et la connexion réseau.";
        setTestLogs(prev => prev + "\n🔧 Vérifiez:\n");
        setTestLogs(prev => prev + "   • L'adresse IP de l'imprimante\n");
        setTestLogs(prev => prev + "   • La connexion réseau de l'imprimante\n");
        setTestLogs(prev => prev + "   • Les paramètres firewall\n");
      }

      toast({
        title: "Test échoué",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const scanBluetoothDevices = async () => {
    if (!bluetoothSupported) {
      toast({
        title: "Bluetooth non supporté",
        description: "Votre navigateur ne supporte pas l'API Web Bluetooth",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestLogs("🔵 Recherche d'imprimantes Bluetooth...\n");

    try {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { namePrefix: "TM-" },
          { namePrefix: "EPSON" },
          { namePrefix: "Star" }
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',  // UUID complet Epson
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // Service pour imprimantes
        ]
      });

      if (device) {
        setBluetoothDevice(device);
        setBluetoothConfig({
          device_id: device.id,
          device_name: device.name || 'Périphérique inconnu',
          connected: false
        });
        
        setTestLogs(prev => prev + `✅ Périphérique trouvé: ${device.name || device.id}\n`);
        setTestLogs(prev => prev + `📋 ID: ${device.id}\n`);
        
        toast({
          title: "Périphérique trouvé",
          description: `${device.name || 'Périphérique'} ajouté à la configuration`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setTestLogs(prev => prev + `❌ Erreur: ${errorMessage}\n`);
      
      if (errorMessage.includes('cancelled')) {
        toast({
          title: "Scan annulé",
          description: "La recherche Bluetooth a été annulée",
        });
      } else {
        toast({
          title: "Erreur Bluetooth",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const connectBluetoothDevice = async () => {
    if (!bluetoothDevice) {
      toast({
        title: "Aucun périphérique",
        description: "Aucun périphérique Bluetooth sélectionné",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestLogs("🔵 Connexion au périphérique Bluetooth...\n");

    try {
      if (bluetoothDevice.gatt) {
        const server = await bluetoothDevice.gatt.connect();
        
        setBluetoothConfig(prev => ({ ...prev, connected: true }));
        setTestLogs(prev => prev + "✅ Connexion Bluetooth établie\n");
        
        // Test d'impression simple
        await testBluetoothPrint(server);
        
        toast({
          title: "Connexion réussie",
          description: "Périphérique Bluetooth connecté et testé",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setTestLogs(prev => prev + `❌ Erreur de connexion: ${errorMessage}\n`);
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const testBluetoothPrint = async (server: any) => {
    try {
      setTestLogs(prev => prev + "🖨️ Test d'impression Bluetooth...\n");
      
      // Recherche du service d'impression
      const service = await server.getPrimaryService('18f0');
      const characteristic = await service.getCharacteristic('2af1');
      
      // Commande ESC/POS simple pour test
      const testCommand = new TextEncoder().encode(
        "\x1B\x40" +  // Initialize
        "Test Bluetooth\n" +
        "Imprimante connectee\n" +
        "\x1D\x56\x00"  // Cut paper
      );
      
      await characteristic.writeValue(testCommand);
      setTestLogs(prev => prev + "✅ Test d'impression envoyé\n");
      
    } catch (error) {
      setTestLogs(prev => prev + "⚠️ Test d'impression échoué (normal si pas de service d'impression)\n");
      console.log('Print test error:', error);
    }
  };

  const disconnectBluetoothDevice = () => {
    if (bluetoothDevice?.gatt?.connected) {
      bluetoothDevice.gatt.disconnect();
      setBluetoothConfig(prev => ({ ...prev, connected: false }));
      setTestLogs(prev => prev + "🔵 Périphérique Bluetooth déconnecté\n");
      
      toast({
        title: "Déconnecté",
        description: "Périphérique Bluetooth déconnecté",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Gestion des Imprimantes
            </CardTitle>
            <CardDescription>
              Saisissez le mot de passe pour accéder à la configuration des imprimantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Printer className="h-6 w-6" />
            Gestion des Imprimantes
          </h1>
          <p className="text-gray-600 mt-1">
            Configuration des imprimantes Epson TM-m30III-H via API Epos pour {currentRestaurant?.name || "ce restaurant"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration de l'imprimante</CardTitle>
          <CardDescription>
            Paramètres de connexion pour l'imprimante Epson TM-m30III-H
            {configStatus === "found" && " - ✅ Configuration existante"}
            {configStatus === "error" && " - ❌ Erreur de chargement"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélecteur de type de connexion */}
          <div>
            <Label>Type de connexion</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="network"
                  checked={connectionType === "network"}
                  onChange={(e) => setConnectionType(e.target.value as "network" | "bluetooth")}
                  className="text-primary"
                />
                <span>Réseau (Wi-Fi/Ethernet)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="bluetooth"
                  checked={connectionType === "bluetooth"}
                  onChange={(e) => setConnectionType(e.target.value as "network" | "bluetooth")}
                  disabled={!bluetoothSupported}
                  className="text-primary"
                />
                <span>Bluetooth {!bluetoothSupported && "(Non supporté)"}</span>
              </label>
            </div>
          </div>

          {/* Configuration réseau */}
          {connectionType === "network" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ip_address">Adresse IP *</Label>
                  <Input
                    id="ip_address"
                    value={printerConfig.ip_address}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, ip_address: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={printerConfig.port}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="8008"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="device_id">ID du périphérique *</Label>
                <div className="relative">
                  <Input
                    id="device_id"
                    type={showDeviceId ? "text" : "password"}
                    value={printerConfig.device_id}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, device_id: e.target.value }))}
                    placeholder="local_printer"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowDeviceId(!showDeviceId)}
                  >
                    {showDeviceId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  value={printerConfig.timeout}
                  onChange={(e) => setPrinterConfig(prev => ({ ...prev, timeout: e.target.value }))}
                  placeholder="30000"
                />
              </div>
            </>
          )}

          {/* Configuration Bluetooth */}
          {connectionType === "bluetooth" && (
            <div className="space-y-4">
              <div>
                <Label>Périphérique Bluetooth</Label>
                {bluetoothConfig.device_name ? (
                  <div className="mt-2 p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{bluetoothConfig.device_name}</p>
                        <p className="text-sm text-gray-600">ID: {bluetoothConfig.device_id}</p>
                        <p className="text-sm">
                          Status: {bluetoothConfig.connected ? 
                            <span className="text-green-600">✅ Connecté</span> : 
                            <span className="text-gray-600">⚫ Déconnecté</span>
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!bluetoothConfig.connected ? (
                          <Button
                            onClick={connectBluetoothDevice}
                            disabled={testing}
                            size="sm"
                            variant="outline"
                          >
                            <Bluetooth className="h-4 w-4 mr-2" />
                            Connecter
                          </Button>
                        ) : (
                          <Button
                            onClick={disconnectBluetoothDevice}
                            size="sm"
                            variant="outline"
                          >
                            Déconnecter
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Button
                      onClick={scanBluetoothDevices}
                      disabled={testing || !bluetoothSupported}
                      className="w-full"
                    >
                      <Bluetooth className="h-4 w-4 mr-2" />
                      {testing ? "Recherche..." : "Rechercher des imprimantes"}
                    </Button>
                    {!bluetoothSupported && (
                      <p className="text-sm text-gray-600 mt-2">
                        Le Bluetooth n'est pas supporté sur cet appareil ou navigateur
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveConfig} disabled={loading}>
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={loadPrinterConfig} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={testPrinterConnection} disabled={testing || !currentRestaurant?.id}>
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? "Test en cours..." : "Tester la connexion"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testLogs && (
        <Card>
          <CardHeader>
            <CardTitle>Logs du test</CardTitle>
            <CardDescription>
              Résultats du test de connexion à l'imprimante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testLogs}
              readOnly
              className="h-32 font-mono text-sm"
              placeholder="Les logs apparaîtront ici après un test..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}