import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, TestTube } from "lucide-react";

const EmailTestManager = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🧪 Test de notification de commande à:', email);
      
      const { data, error } = await supabase.functions.invoke('send-order-notification', {
        body: { 
          email,
          name: "Test User",
          orderId: "TEST-001",
          status: "en préparation",
          statusMessage: "est en cours de préparation"
        }
      });

      console.log('📡 Résultat test:', { data, error });

      if (error) {
        console.error('❌ Erreur test:', error);
        toast({
          title: "Erreur d'envoi",
          description: `Erreur: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Email de notification envoyé');
      
      toast({
        title: "Test envoyé",
        description: `Email de test envoyé à ${email}`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('❌ Erreur test email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test d'envoi d'email
        </CardTitle>
        <CardDescription>
          Testez l'envoi d'emails de notification sans passer de commande
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Adresse email de test</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Button 
          onClick={sendTestEmail}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? "Envoi en cours..." : "Envoyer un test"}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p>Ce test utilise la même fonction que les vraies notifications de commande.</p>
          <p>Vérifiez les logs de la fonction pour diagnostiquer les problèmes.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestManager;