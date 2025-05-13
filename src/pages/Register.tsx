
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  image_url: string | null;
  code: string | null;
}

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loadingPromotion, setLoadingPromotion] = useState(true);
  
  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('title', '-10% sur votre première commande')
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération de la promotion:", error);
        } else {
          setPromotion(data);
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setLoadingPromotion(false);
      }
    };
    
    fetchPromotion();
  }, []);

  const sendWelcomeEmail = async (email: string, promoCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: { 
          email, 
          promoCode
        }
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
        return false;
      }
      
      console.log("Email de bienvenue envoyé avec succès:", data);
      return true;
    } catch (error) {
      console.error("Exception lors de l'envoi de l'email de bienvenue:", error);
      return false;
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: error.message,
        });
      } else {
        // Récupérer le code promo
        const promoCode = promotion?.code || "BIENVENUE10";
        
        // Envoyer l'email de bienvenue avec le code promo
        await sendWelcomeEmail(email, promoCode);
        
        let successMessage = "Vérifiez votre email pour confirmer votre compte et profitez de 10% de réduction sur votre prochaine commande!";
        
        toast({
          title: "Inscription réussie",
          description: successMessage,
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      toast({
        variant: "destructive",
        title: "Erreur du serveur",
        description: "Une erreur est survenue lors de l'inscription",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        {loadingPromotion ? (
          <div className="flex justify-center items-center mb-6 p-4">
            <Loader2 className="h-6 w-6 animate-spin text-gold-600" />
          </div>
        ) : promotion ? (
          <div className="mb-6 bg-gradient-to-r from-gold-500 to-gold-300 p-4 rounded-lg shadow-lg text-center">
            <Badge className="bg-white text-gold-600 mb-2">OFFRE SPÉCIALE</Badge>
            <h3 className="text-white text-xl font-bold mb-1">{promotion.title}</h3>
            <p className="text-white/90">{promotion.description}</p>
            {/* Le code de promotion est masqué intentionnellement */}
          </div>
        ) : (
          <div className="mb-6 bg-gradient-to-r from-gold-500 to-gold-300 p-4 rounded-lg shadow-lg text-center">
            <Badge className="bg-white text-gold-600 mb-2">OFFRE SPÉCIALE</Badge>
            <h3 className="text-white text-xl font-bold mb-1">-10% sur votre première commande</h3>
            <p className="text-white/90">Créez un compte maintenant et profitez de 10% de réduction</p>
          </div>
        )}
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              Inscrivez-vous pour commencer votre expérience SushiEats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gold-500 hover:bg-gold-600 text-black" 
                disabled={isLoading}
              >
                {isLoading ? "Inscription en cours..." : "S'inscrire"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              Vous avez déjà un compte?{" "}
              <Link to="/login" className="text-gold-600 hover:underline">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
