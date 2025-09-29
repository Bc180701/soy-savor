
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    };
    
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password || !confirmPassword) {
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
      console.log("Mise à jour du mot de passe...");
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error("Erreur de mise à jour:", error);
        setError(error.message);
      } else {
        toast({
          variant: "success",
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été mis à jour avec succès",
        });
        navigate("/compte");
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      setError("Une erreur est survenue lors de la mise à jour du mot de passe");
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
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Modifier le mot de passe</CardTitle>
            <CardDescription className="text-center">
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!user ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Non autorisé</AlertTitle>
                <AlertDescription>
                  Vous devez être connecté pour modifier votre mot de passe. Veuillez utiliser le lien envoyé à votre email.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
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
                  className="w-full bg-akane-600 hover:bg-akane-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Mise à jour en cours..." : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              <Button 
                variant="link" 
                className="text-akane-600 p-0 h-auto" 
                onClick={() => navigate("/compte")}
              >
                Retour à mon compte
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;
