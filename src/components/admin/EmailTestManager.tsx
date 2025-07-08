import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, CheckCircle, XCircle } from "lucide-react";

const EmailTestManager = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);
  const { toast } = useToast();

  const handleTestEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer une adresse email pour le test.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🧪 Envoi d'un email de test à:", email);
      
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          email: email.trim(),
          name: name.trim() || "Test User"
        }
      });

      if (error) {
        console.error("❌ Erreur lors de l'envoi de l'email de test:", error);
        setLastResult({
          success: false,
          message: `Erreur: ${error.message}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        toast({
          title: "Erreur d'envoi",
          description: `Impossible d'envoyer l'email de test: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Réponse de l'email de test:", data);
      
      if (data.success) {
        setLastResult({
          success: true,
          message: `Email envoyé avec succès à ${email}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        toast({
          title: "Email envoyé !",
          description: `L'email de test a été envoyé avec succès à ${email}`,
        });
      } else {
        setLastResult({
          success: false,
          message: `Échec: ${data.error || 'Erreur inconnue'}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        toast({
          title: "Erreur d'envoi",
          description: data.error || "Une erreur est survenue lors de l'envoi",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erreur dans handleTestEmail:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setLastResult({
        success: false,
        message: `Exception: ${errorMessage}`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
      toast({
        title: "Erreur système",
        description: `Une erreur système est survenue: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test d'envoi d'emails
        </CardTitle>
        <CardDescription>
          Testez l'envoi d'emails via Brevo sans avoir à passer une commande réelle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="test-email">Adresse email de test *</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="test-name">Nom (optionnel)</Label>
            <Input
              id="test-name"
              type="text"
              placeholder="Test User"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <Button 
          onClick={handleTestEmail} 
          disabled={isLoading || !email.trim()}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? "Envoi en cours..." : "Envoyer un email de test"}
        </Button>

        {lastResult && (
          <div className={`p-4 rounded-lg border ${
            lastResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  lastResult.success ? "text-green-800" : "text-red-800"
                }`}>
                  {lastResult.success ? "Succès" : "Échec"}
                </p>
                <p className={`text-sm ${
                  lastResult.success ? "text-green-700" : "text-red-700"
                }`}>
                  {lastResult.message}
                </p>
                <p className={`text-xs mt-1 ${
                  lastResult.success ? "text-green-600" : "text-red-600"
                }`}>
                  {lastResult.timestamp}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>Note:</strong> Vérifiez les logs de la fonction test-email pour plus de détails sur l'envoi.
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestManager;