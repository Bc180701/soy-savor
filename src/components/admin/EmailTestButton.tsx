
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2 } from "lucide-react";

const EmailTestButton = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTestEmail = async () => {
    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('🔧 Début du test d\'envoi d\'email...');

    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { email }
      });

      console.log('📧 Résultat:', data);
      console.log('❌ Erreur:', error);

      if (error) {
        console.error('❌ Erreur complète:', error);
        toast({
          title: "Erreur",
          description: `Erreur lors de l'envoi: ${error.message || 'Erreur inconnue'}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "✅ Email envoyé !",
          description: `Email de test envoyé avec succès à ${email}`,
          variant: "success",
        });
        console.log('🎉 Email envoyé avec l\'ID:', data.messageId);
      } else {
        toast({
          title: "Échec de l'envoi",
          description: data?.error || "Erreur inconnue",
          variant: "destructive",
        });
        console.log('❌ Détails de l\'erreur:', data);
      }

    } catch (err) {
      console.error('💥 Erreur inattendue:', err);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Mail className="h-5 w-5" />
        Test d'envoi d'email Brevo
      </h3>
      
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="votre-email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleTestEmail}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Tester
            </>
          )}
        </Button>
      </div>
      
      <p className="text-sm text-gray-600">
        Cliquez sur "Tester" pour envoyer un email de test via Brevo. 
        Vérifiez les logs dans la console pour plus de détails.
      </p>
    </div>
  );
};

export default EmailTestButton;
