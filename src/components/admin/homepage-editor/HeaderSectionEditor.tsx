
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HeaderSection } from "@/hooks/useHomepageData";

interface HeaderSectionEditorProps {
  data?: HeaderSection;
  onSave: (data: HeaderSection) => void;
}

const HeaderSectionEditor = ({ data, onSave }: HeaderSectionEditorProps) => {
  const [formData, setFormData] = useState<HeaderSection>({
    logo_alt: "SushiEats Logo",
    nav_links: {
      home: "Accueil",
      menu: "Menu",
      order: "Commander",
      contact: "Contact"
    },
    buttons: {
      login: "Se connecter",
      order: "Commander"
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleNavLinkChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      nav_links: {
        ...prev.nav_links,
        [field]: value
      }
    }));
  };

  const handleButtonChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave(formData);
      toast({
        title: "Header enregistré",
        description: "Les modifications ont été sauvegardées avec succès",
        variant: "success"
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="logo-alt">Texte alternatif du logo</Label>
            <Input
              id="logo-alt"
              value={formData.logo_alt}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_alt: e.target.value }))}
              placeholder="SushiEats Logo"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liens de navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="nav-home">Accueil</Label>
            <Input
              id="nav-home"
              value={formData.nav_links.home}
              onChange={(e) => handleNavLinkChange('home', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="nav-menu">Menu</Label>
            <Input
              id="nav-menu"
              value={formData.nav_links.menu}
              onChange={(e) => handleNavLinkChange('menu', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="nav-order">Commander</Label>
            <Input
              id="nav-order"
              value={formData.nav_links.order}
              onChange={(e) => handleNavLinkChange('order', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="nav-contact">Contact</Label>
            <Input
              id="nav-contact"
              value={formData.nav_links.contact}
              onChange={(e) => handleNavLinkChange('contact', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boutons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="btn-login">Bouton de connexion</Label>
            <Input
              id="btn-login"
              value={formData.buttons.login}
              onChange={(e) => handleButtonChange('login', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="btn-order">Bouton de commande</Label>
            <Input
              id="btn-order"
              value={formData.buttons.order}
              onChange={(e) => handleButtonChange('order', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isSaving}
          className="bg-gold-600 hover:bg-gold-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
};

export default HeaderSectionEditor;
