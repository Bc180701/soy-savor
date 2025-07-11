
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send } from "lucide-react";

const EmailTestButton = () => {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testName, setTestName] = useState("Test Client");
  const [selectedStatus, setSelectedStatus] = useState("confirmée");
  const { toast } = useToast();

  const statusOptions = [
    { value: "confirmée", label: "Confirmée" },
    { value: "en_preparation", label: "En préparation" },
    { value: "prête", label: "Prête" },
    { value: "en_livraison", label: "En livraison" },
    { value: "livrée", label: "Livrée" },
    { value: "récupérée", label: "Récupérée" }
  ];

  const testEmailNotification = async (status: string) => {
    if (!testEmail || !testName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir l'email et le nom de test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`🧪 Test d'envoi d'email - Statut: ${status}`);
      
      const testOrderId = `TEST-${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke('change-statut-notif', {
        body: {
          email: testEmail,
          name: testName,
          orderId: testOrderId,
          status: status
        }
      });
      
      if (error) {
        console.error("❌ Erreur lors du test d'email:", error);
        throw error;
      }
      
      console.log("✅ Test d'email réussi:", data);
      
      toast({
        title: "Test réussi",
        description: `Email de test envoyé avec le statut "${status}" à ${testEmail}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error("💥 Erreur lors du test d'email:", error);
      toast({
        title: "Erreur de test",
        description: `Impossible d'envoyer l'email de test: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testAllStatuses = async () => {
    if (!testEmail || !testName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir l'email et le nom de test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      for (const statusOption of statusOptions) {
        console.log(`🧪 Test en cours pour le statut: ${statusOption.value}`);
        await testEmailNotification(statusOption.value);
        // Petite pause entre chaque envoi
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: "Tests terminés",
        description: `Tous les emails de test ont été envoyés à ${testEmail}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error("💥 Erreur lors des tests multiples:", error);
      toast({
        title: "Erreur des tests",
        description: "Une erreur est survenue pendant les tests multiples",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test des notifications email avec Resend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email de test</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-name">Nom de test</Label>
            <Input
              id="test-name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Test Client"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test par statut individuel</h3>
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => testEmailNotification(selectedStatus)}
              disabled={loading}
              className="bg-gold-500 hover:bg-gold-600 text-black"
            >
              <Send className="h-4 w-4 mr-2" />
              Tester ce statut
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test de tous les statuts</h3>
          <p className="text-sm text-gray-600">
            Envoie un email de test pour chaque statut de commande avec la nouvelle fonction Resend
          </p>
          <Button
            onClick={testAllStatuses}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            {loading ? "Test en cours..." : "Tester tous les statuts"}
          </Button>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Nouvelle fonction : change-statut-notif</h4>
          <p className="text-sm text-green-700 mt-2">
            Cette nouvelle fonction utilise Resend dès le départ et remplace l'ancienne fonction qui utilisait Brevo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestButton;
