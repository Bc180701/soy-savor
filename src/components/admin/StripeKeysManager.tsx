
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const StripeKeysManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      const { data, error } = await supabase.functions.invoke('get-stripe-key', {
        body: { restaurantId: currentRestaurant.id }
      });
      
      if (error) throw error;
      
      if (data?.stripeKey) {
        setStripeSecretKey(data.stripeKey);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la clé:', error);
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

  const handleSaveKey = async () => {
    if (!currentRestaurant || !stripeSecretKey) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un restaurant et saisir une clé API.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('save-stripe-key', {
        body: { 
          restaurantId: currentRestaurant.id,
          stripeKey: stripeSecretKey
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Clé API sauvegardée",
        description: `La clé Stripe pour ${currentRestaurant.name} a été mise à jour.`,
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la clé API.",
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
          <CardTitle>Gestion des clés API Stripe</CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentRestaurant ? `Restaurant: ${currentRestaurant.name}` : "Veuillez sélectionner un restaurant"}
          </p>
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
          
          <Button 
            onClick={handleSaveKey} 
            disabled={!currentRestaurant || !stripeSecretKey || isLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Sauvegarde..." : "Sauvegarder la clé API"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeKeysManager;
