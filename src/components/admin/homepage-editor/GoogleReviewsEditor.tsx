
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface GoogleReviewsData {
  title?: string;
  description?: string;
  google_business_url?: string;
  average_rating?: number;
  total_reviews?: number;
  button_text?: string;
  review_button_text?: string;
}

interface GoogleReviewsEditorProps {
  data?: GoogleReviewsData;
  onSave: (data: GoogleReviewsData) => void;
}

const GoogleReviewsEditor = ({ data, onSave }: GoogleReviewsEditorProps) => {
  const [formData, setFormData] = useState<GoogleReviewsData>({
    title: data?.title || "Nos avis clients",
    description: data?.description || "Découvrez ce que nos clients pensent de notre restaurant",
    google_business_url: data?.google_business_url || "",
    average_rating: data?.average_rating || 4.5,
    total_reviews: data?.total_reviews || 0,
    button_text: data?.button_text || "Voir tous nos avis Google",
    review_button_text: data?.review_button_text || "Laisser un avis"
  });

  const handleInputChange = (field: keyof GoogleReviewsData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des avis Google</CardTitle>
          <CardDescription>
            Configurez les informations de votre profil Google Business pour afficher vos vrais avis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de la section</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Nos avis clients"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Découvrez ce que nos clients pensent de notre restaurant"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="google_business_url">URL de votre profil Google Business</Label>
            <Input
              id="google_business_url"
              value={formData.google_business_url}
              onChange={(e) => handleInputChange('google_business_url', e.target.value)}
              placeholder="https://www.google.com/maps/place/Votre+Restaurant/@..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Copiez l'URL de votre profil Google Maps/Business ici
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="average_rating">Note moyenne</Label>
              <Input
                id="average_rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.average_rating}
                onChange={(e) => handleInputChange('average_rating', parseFloat(e.target.value))}
                placeholder="4.5"
              />
            </div>

            <div>
              <Label htmlFor="total_reviews">Nombre total d'avis</Label>
              <Input
                id="total_reviews"
                type="number"
                min="0"
                value={formData.total_reviews}
                onChange={(e) => handleInputChange('total_reviews', parseInt(e.target.value))}
                placeholder="150"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="button_text">Texte du bouton "Voir tous les avis"</Label>
            <Input
              id="button_text"
              value={formData.button_text}
              onChange={(e) => handleInputChange('button_text', e.target.value)}
              placeholder="Voir tous nos avis Google"
            />
          </div>

          <div>
            <Label htmlFor="review_button_text">Texte du bouton "Laisser un avis"</Label>
            <Input
              id="review_button_text"
              value={formData.review_button_text}
              onChange={(e) => handleInputChange('review_button_text', e.target.value)}
              placeholder="Laisser un avis"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Enregistrer les paramètres
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleReviewsEditor;
