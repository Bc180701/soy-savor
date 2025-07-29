import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface FeaturedProductsSettings {
  show_nouveautes: boolean;
  show_populaires: boolean;
  show_exclusivites: boolean;
}

const FeaturedProductsEditor = () => {
  const [settings, setSettings] = useState<FeaturedProductsSettings>({
    show_nouveautes: true,
    show_populaires: true,
    show_exclusivites: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_products_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        throw error;
      }

      if (data) {
        setSettings({
          show_nouveautes: data.show_nouveautes,
          show_populaires: data.show_populaires,
          show_exclusivites: data.show_exclusivites
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: FeaturedProductsSettings) => {
    try {
      setSaving(true);
      
      // Essayer de mettre à jour le premier enregistrement
      const { data: existingData } = await supabase
        .from('featured_products_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingData) {
        // Mettre à jour l'enregistrement existant
        const { error: updateError } = await supabase
          .from('featured_products_settings')
          .update(newSettings)
          .eq('id', existingData.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Créer un nouvel enregistrement
        const { error: insertError } = await supabase
          .from('featured_products_settings')
          .insert(newSettings);

        if (insertError) {
          throw insertError;
        }
      }

      setSettings(newSettings);
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres des sections ont été mis à jour"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (field: keyof FeaturedProductsSettings, value: boolean) => {
    const newSettings = {
      ...settings,
      [field]: value
    };
    await saveSettings(newSettings);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Chargement des paramètres...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des sections de produits mis en avant</CardTitle>
        <CardDescription>
          Contrôlez quelles sections sont visibles sur la page d'accueil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="nouveautes" className="text-base font-medium">
              Section "Nouveautés"
            </Label>
            <p className="text-sm text-muted-foreground">
              Afficher l'onglet des produits nouveaux
            </p>
          </div>
          <Switch
            id="nouveautes"
            checked={settings.show_nouveautes}
            onCheckedChange={(checked) => handleToggle('show_nouveautes', checked)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="populaires" className="text-base font-medium">
              Section "Populaires"
            </Label>
            <p className="text-sm text-muted-foreground">
              Afficher l'onglet des produits populaires
            </p>
          </div>
          <Switch
            id="populaires"
            checked={settings.show_populaires}
            onCheckedChange={(checked) => handleToggle('show_populaires', checked)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="exclusivites" className="text-base font-medium">
              Section "Exclusivités"
            </Label>
            <p className="text-sm text-muted-foreground">
              Afficher l'onglet des produits exclusifs
            </p>
          </div>
          <Switch
            id="exclusivites"
            checked={settings.show_exclusivites}
            onCheckedChange={(checked) => handleToggle('show_exclusivites', checked)}
            disabled={saving}
          />
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sauvegarde en cours...</span>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Note :</strong> Si toutes les sections sont désactivées, 
            la section "Produits mis en avant" sera complètement masquée sur la page d'accueil.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedProductsEditor;