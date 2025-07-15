
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const StripeKeysManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'saved' | 'error'>('unknown');
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    if (isAuthenticated && currentRestaurant) {
      loadStripeKey();
    }
  }, [isAuthenticated, currentRestaurant]);

  const loadStripeKey = async () => {
    if (!currentRestaurant) return;
    
    try {
      console.log('🔍 Chargement de la clé pour restaurant:', currentRestaurant.id);
      const { data, error } = await supabase.functions.invoke('get-stripe-key', {
        body: { restaurantId: currentRestaurant.id }
      });
      
      if (error) {
        console.error('Erreur lors du chargement:', error);
        setKeyStatus('error');
        setErrorMessage(error.message || 'Erreur lors du chargement');
        throw error;
      }
      
      if (data?.stripeKey) {
        setStripeSecretKey(data.stripeKey);
        setKeyStatus('saved');
        console.log('✅ Clé chargée avec succès');
      } else {
        setKeyStatus('unknown');
        console.log('ℹ️ Aucune clé trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la clé:', error);
      setKeyStatus('error');
      setErrorMessage('Impossible de charger la clé existante');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "SushiMDP1313") {
      setIsAuthenticated(true);
      toast({
        title: "Accès autorisé",
        description: "Vous pouvez maintenant gérer les clés API Stripe.",
      });
    } else {
      toast({
        title: "Mot de passe incorrect",
        description: "Veuillez vérifier votre mot de passe.",
        variant: "destructive",
      });
    }
  };

  const validateStripeKey = (key: string) => {
    if (!key.startsWith('sk_live_') && !key.startsWith('sk_test_')) {
      return "La clé doit commencer par 'sk_live_' ou 'sk_test_'";
    }
    if (key.length < 20) {
      return "La clé semble trop courte";
    }
    return null;
  };

  const handleSaveKey = async () => {
    if (!currentRestaurant || !stripeSecretKey) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un restaurant et saisir une clé API.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateStripeKey(stripeSecretKey);
    if (validationError) {
      toast({
        title: "Format invalide",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log('💾 Sauvegarde de la clé pour restaurant:', currentRestaurant.id);
      const { data, error } = await supabase.functions.invoke('save-stripe-key', {
        body: { 
          restaurantId: currentRestaurant.id,
          stripeKey: stripeSecretKey
        }
      });
      
      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        setKeyStatus('error');
        setErrorMessage(error.message || 'Erreur lors de la sauvegarde');
        throw error;
      }
      
      console.log('✅ Réponse de sauvegarde:', data);
      setKeyStatus('saved');
      toast({
        title: "Clé API sauvegardée",
        description: `La clé Stripe pour ${currentRestaurant.name} a été mise à jour avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setKeyStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Impossible de sauvegarder la clé API';
      setErrorMessage(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testStripeKey = async () => {
    if (!currentRestaurant) return;
    
    setIsLoading(true);
    try {
      console.log('🧪 Test de la clé Stripe...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: [{ menuItem: { id: 'test', name: 'Test', price: 1 }, quantity: 1 }],
          subtotal: 1,
          tax: 0,
          deliveryFee: 0,
          tip: 0,
          discount: 0,
          total: 1,
          orderType: 'delivery',
          clientName: 'Test',
          clientEmail: 'test@test.com',
          clientPhone: '0123456789',
          scheduledFor: new Date().toISOString(),
          restaurantId: currentRestaurant.id,
          successUrl: window.location.origin + '/test',
          cancelUrl: window.location.origin + '/test',
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Test réussi",
        description: "La clé Stripe fonctionne correctement !",
      });
    } catch (error) {
      console.error('Erreur lors du test:', error);
      toast({
        title: "Test échoué",
        description: "La clé Stripe ne fonctionne pas. Vérifiez qu'elle est correcte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Accès sécurisé - Clés API Stripe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Mot de passe d'administration</Label>
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
              Accéder à la gestion des clés API
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Gestion des clés API Stripe
            {keyStatus === 'saved' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {keyStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentRestaurant ? `Restaurant: ${currentRestaurant.name}` : "Veuillez sélectionner un restaurant"}
          </p>
          {keyStatus === 'saved' && (
            <p className="text-sm text-green-600">✅ Clé API configurée et sauvegardée</p>
          )}
          {keyStatus === 'error' && (
            <p className="text-sm text-red-600">❌ Erreur: {errorMessage}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stripeKey">Clé secrète Stripe</Label>
            <div className="flex gap-2">
              <Input
                id="stripeKey"
                type={showKey ? "text" : "password"}
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="sk_live_... ou sk_test_..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Format attendu: sk_live_... pour la production ou sk_test_... pour les tests
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveKey} 
              disabled={!currentRestaurant || !stripeSecretKey || isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Sauvegarde..." : "Sauvegarder la clé API"}
            </Button>
            
            {keyStatus === 'saved' && (
              <Button 
                onClick={testStripeKey} 
                disabled={isLoading}
                variant="outline"
              >
                Tester la clé
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeKeysManager;
