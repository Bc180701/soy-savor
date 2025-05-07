
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HeroSectionEditor from "./homepage-editor/HeroSectionEditor";
import PromotionsEditor from "./homepage-editor/PromotionsEditor";
import DeliveryZonesEditor from "./homepage-editor/DeliveryZonesEditor";
import OrderOptionsEditor from "./homepage-editor/OrderOptionsEditor";
import { HomepageData, useHomepageData } from "@/hooks/useHomepageData";

const HomepageEditor = () => {
  const { data: homepageData, loading, error, refetch } = useHomepageData();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveHomepageData = async (section: string, data: any) => {
    try {
      setSaveError(null);
      setIsSaving(true);
      
      console.log(`Saving ${section} data:`, data);
      
      // Appel direct à la fonction RPC pour mettre à jour les données
      const { error } = await supabase.rpc('update_homepage_data', { 
        section_name: section,
        section_data: data
      });

      if (error) {
        console.error("Error updating homepage data:", error);
        throw error;
      }
      
      // Rafraîchir les données après sauvegarde
      await refetch();
      
      toast({
        title: "Enregistré",
        description: `Les modifications de la section ont été enregistrées.`,
        variant: "success",
      });
    } catch (error: any) {
      console.error("Error saving homepage data:", error);
      setSaveError(error.message || "Une erreur est survenue lors de la sauvegarde");
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error && !homepageData) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>
          {error.message}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="ml-2"
          >
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Personnalisation de la page d'accueil</h2>
        <p className="text-muted-foreground mb-6">
          Modifiez les différentes sections de votre page d'accueil pour personnaliser votre site.
        </p>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de sauvegarde</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hero">Section Principale</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="delivery">Zones de livraison</TabsTrigger>
          <TabsTrigger value="order">Options de commande</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Section principale</CardTitle>
              <CardDescription>
                Personnalisez l'image de fond, le titre et le sous-titre de la section principale.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeroSectionEditor 
                data={homepageData.hero_section} 
                onSave={(data) => saveHomepageData('hero_section', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions</CardTitle>
              <CardDescription>
                Gérez les promotions qui apparaissent sur la page d'accueil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionsEditor 
                data={homepageData.promotions} 
                onSave={(data) => saveHomepageData('promotions', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Zones de livraison</CardTitle>
              <CardDescription>
                Modifiez les zones de livraison affichées sur la page d'accueil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryZonesEditor 
                data={homepageData.delivery_zones} 
                onSave={(data) => saveHomepageData('delivery_zones', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle>Options de commande</CardTitle>
              <CardDescription>
                Personnalisez les options de commande affichées sur la page d'accueil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderOptionsEditor 
                data={homepageData.order_options} 
                onSave={(data) => saveHomepageData('order_options', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomepageEditor;
