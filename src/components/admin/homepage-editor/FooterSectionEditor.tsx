
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FooterSection } from "@/hooks/useHomepageData";

interface FooterSectionEditorProps {
  data?: FooterSection;
  onSave: (data: FooterSection) => void;
}

const FooterSectionEditor = ({ data, onSave }: FooterSectionEditorProps) => {
  const [formData, setFormData] = useState<FooterSection>({
    company_description: "Découvrez l'art du sushi à Châteaurenard. Des produits frais préparés avec soin pour une expérience gourmande unique.",
    navigation_title: "Navigation",
    hours_title: "Horaires d'ouverture",
    contact_title: "Contact",
    opening_hours: {
      monday: "Fermé",
      tuesday: "11:00–14:00, 18:00–22:00",
      wednesday: "11:00–14:00, 18:00–22:00",
      thursday: "11:00–14:00, 18:00–22:00",
      friday: "11:00–14:00, 18:00–22:00",
      saturday: "11:00–14:00, 18:00–22:00",
      sunday: "Fermé"
    },
    copyright_text: "SushiEats. Tous droits réservés.",
    legal_links: {
      mentions_legales: "Mentions légales",
      cgv: "CGV",
      confidentialite: "Politique de confidentialité"
    },
    social_links: {
      facebook_aria: "Facebook",
      instagram_aria: "Instagram",
      linkedin_aria: "LinkedIn"
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleOpeningHoursChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [field]: value
      }
    }));
  };

  const handleLegalLinksChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      legal_links: {
        ...prev.legal_links,
        [field]: value
      }
    }));
  };

  const handleSocialLinksChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
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
        title: "Footer enregistré",
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
          <CardTitle>Description de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="company-description">Description</Label>
            <Textarea
              id="company-description"
              value={formData.company_description}
              onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
              placeholder="Description de l'entreprise"
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Titres des sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="navigation-title">Titre de la navigation</Label>
            <Input
              id="navigation-title"
              value={formData.navigation_title}
              onChange={(e) => setFormData(prev => ({ ...prev, navigation_title: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hours-title">Titre des horaires</Label>
            <Input
              id="hours-title"
              value={formData.hours_title}
              onChange={(e) => setFormData(prev => ({ ...prev, hours_title: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="contact-title">Titre du contact</Label>
            <Input
              id="contact-title"
              value={formData.contact_title}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_title: e.target.value }))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horaires d'ouverture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="monday">Lundi</Label>
            <Input
              id="monday"
              value={formData.opening_hours.monday}
              onChange={(e) => handleOpeningHoursChange('monday', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tuesday">Mardi</Label>
            <Input
              id="tuesday"
              value={formData.opening_hours.tuesday}
              onChange={(e) => handleOpeningHoursChange('tuesday', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="wednesday">Mercredi</Label>
            <Input
              id="wednesday"
              value={formData.opening_hours.wednesday}
              onChange={(e) => handleOpeningHoursChange('wednesday', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="thursday">Jeudi</Label>
            <Input
              id="thursday"
              value={formData.opening_hours.thursday}
              onChange={(e) => handleOpeningHoursChange('thursday', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="friday">Vendredi</Label>
            <Input
              id="friday"
              value={formData.opening_hours.friday}
              onChange={(e) => handleOpeningHoursChange('friday', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="saturday">Samedi</Label>
            <Input
              id="saturday"
              value={formData.opening_hours.saturday}
              onChange={(e) => handleOpeningHoursChange('saturday', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sunday">Dimanche</Label>
            <Input
              id="sunday"
              value={formData.opening_hours.sunday}
              onChange={(e) => handleOpeningHoursChange('sunday', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textes légaux et réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="copyright">Texte de copyright</Label>
            <Input
              id="copyright"
              value={formData.copyright_text}
              onChange={(e) => setFormData(prev => ({ ...prev, copyright_text: e.target.value }))}
              className="mt-1"
            />
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Liens légaux</h4>
            <div>
              <Label htmlFor="mentions">Mentions légales</Label>
              <Input
                id="mentions"
                value={formData.legal_links.mentions_legales}
                onChange={(e) => handleLegalLinksChange('mentions_legales', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cgv">CGV</Label>
              <Input
                id="cgv"
                value={formData.legal_links.cgv}
                onChange={(e) => handleLegalLinksChange('cgv', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confidentialite">Politique de confidentialité</Label>
              <Input
                id="confidentialite"
                value={formData.legal_links.confidentialite}
                onChange={(e) => handleLegalLinksChange('confidentialite', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Labels des réseaux sociaux</h4>
            <div>
              <Label htmlFor="facebook-aria">Facebook (texte alternatif)</Label>
              <Input
                id="facebook-aria"
                value={formData.social_links.facebook_aria}
                onChange={(e) => handleSocialLinksChange('facebook_aria', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="instagram-aria">Instagram (texte alternatif)</Label>
              <Input
                id="instagram-aria"
                value={formData.social_links.instagram_aria}
                onChange={(e) => handleSocialLinksChange('instagram_aria', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="linkedin-aria">LinkedIn (texte alternatif)</Label>
              <Input
                id="linkedin-aria"
                value={formData.social_links.linkedin_aria}
                onChange={(e) => handleSocialLinksChange('linkedin_aria', e.target.value)}
                className="mt-1"
              />
            </div>
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

export default FooterSectionEditor;
