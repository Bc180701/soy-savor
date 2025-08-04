import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { Eye, EyeOff, Printer, TestTube, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { loadEPOSScript, EPosPrinter, type PrinterConfig } from "@/utils/epos-print";

export default function PrintersManager() {
  const [printerConfig, setPrinterConfig] = useState({
    ip_address: "",
    port: "8008",
    device_id: "",
    timeout: "30000"
  });
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDeviceId, setShowDeviceId] = useState(true);
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<"none" | "found" | "error">("none");
  const [testLogs, setTestLogs] = useState("");
  const [testing, setTesting] = useState(false);

  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const { canAccessSection } = useAdminPermissions();

  // Vérifier les permissions d'accès
  if (!canAccessSection('printers')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès refusé</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isAuthenticated && currentRestaurant?.id) {
      // Réinitialiser la configuration quand on change de restaurant
      setPrinterConfig({
        ip_address: "",
        port: "8008",
        device_id: "",
        timeout: "30000"
      });
      setConfigStatus("none");
      setTestLogs("");
      loadPrinterConfig();
    }
  }, [isAuthenticated, currentRestaurant?.id]);

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
        setPrinterConfig(data.printerConfig);
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
      const { error } = await supabase.functions.invoke('save-printer-config', {
        body: { 
          restaurantId: currentRestaurant.id,
          printerConfig 
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
    setTestLogs("🔄 Test de connexion en cours...\n");
    setTestLogs(prev => prev + "🔧 TEST DIRECT CÔTÉ CLIENT (contourne les limitations serveur)\n\n");

    try {
      const printer = new EPosPrinter(printerConfig as PrinterConfig);
      const result = await printer.testConnection();
      
      if (result.success) {
        setTestLogs(prev => prev + `✅ ${result.message}\n`);
        if (result.details) {
          setTestLogs(prev => prev + `📋 ${result.details}\n`);
        }
        setTestLogs(prev => prev + "\n🎉 CONNEXION RÉUSSIE!\n");
        setTestLogs(prev => prev + "💡 L'imprimante est prête pour l'impression des commandes\n");
        
        toast({
          title: "Test réussi",
          description: "L'imprimante est configurée et fonctionnelle",
        });
        
      } else {
        setTestLogs(prev => prev + `❌ ${result.message}\n`);
        if (result.details) {
          setTestLogs(prev => prev + `📋 ${result.details}\n`);
        }
        
        if (result.message.includes('Mixed Content') || result.details?.includes('CORS')) {
          showMixedContentInstructions();
        } else {
          showTroubleshootingInstructions();
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setTestLogs(prev => prev + `❌ Erreur: ${errorMessage}\n`);
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        showMixedContentInstructions();
      } else {
        showTroubleshootingInstructions();
      }
      
      toast({
        title: "Erreur de test",
        description: "Consultez les instructions ci-dessous",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const showMixedContentInstructions = () => {
    setTestLogs(prev => prev + "\n🚨 PROBLÈME: Mixed Content (HTTPS/HTTP) bloqué par le navigateur\n");
    setTestLogs(prev => prev + "\n🔧 SOLUTIONS PAR NAVIGATEUR:\n");
    setTestLogs(prev => prev + "\n📍 CHROME/EDGE:\n");
    setTestLogs(prev => prev + "1. Cliquez sur l'icône 🔒 à gauche de l'URL\n");
    setTestLogs(prev => prev + "2. Cliquez sur 'Paramètres du site'\n");
    setTestLogs(prev => prev + "3. Trouvez 'Contenu non sécurisé' et changez vers 'Autoriser'\n");
    setTestLogs(prev => prev + "4. Rechargez la page (F5) et retestez\n");
    setTestLogs(prev => prev + "\n📍 FIREFOX:\n");
    setTestLogs(prev => prev + "1. Cliquez sur l'icône 🔒 à gauche de l'URL\n");
    setTestLogs(prev => prev + "2. Cliquez sur '>' puis 'Connexion non sécurisée autorisée'\n");
    setTestLogs(prev => prev + "3. Rechargez et retestez\n");
    setTestLogs(prev => prev + "\n⚡ ALTERNATIVE: Accès direct via http://192.168.1.129:8008\n");
    setTestLogs(prev => prev + "   Ouvrez un nouvel onglet et allez à cette adresse pour tester\n");
    
    toast({
      title: "Configuration navigateur requise",
      description: "Consultez les instructions pour autoriser le contenu mixte",
      variant: "destructive",
    });
  };

  const showTroubleshootingInstructions = () => {
    setTestLogs(prev => prev + "\n🔧 DÉPANNAGE GÉNÉRAL:\n");
    setTestLogs(prev => prev + "1. Vérifiez que l'imprimante est allumée\n");
    setTestLogs(prev => prev + "2. Vérifiez la connexion réseau (même WiFi/réseau)\n");
    setTestLogs(prev => prev + "3. Pingez l'IP depuis un terminal: ping " + printerConfig.ip_address + "\n");
    setTestLogs(prev => prev + "4. Vérifiez les paramètres réseau de l'imprimante\n");
    setTestLogs(prev => prev + "5. Redémarrez l'imprimante si nécessaire\n");
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