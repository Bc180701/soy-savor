
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calendar, Trash2, Plus } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { 
  getRestaurantClosures, 
  addRestaurantClosure, 
  deleteRestaurantClosure,
  RestaurantClosure 
} from "@/services/openingHoursService";

const RestaurantClosuresManager = () => {
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closures, setClosures] = useState<RestaurantClosure[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    closure_date: '',
    reason: '',
    is_all_day: true,
    start_time: '09:00',
    end_time: '18:00'
  });

  const fetchClosures = async () => {
    if (!currentRestaurant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getRestaurantClosures(currentRestaurant.id);
      setClosures(data);
    } catch (error) {
      console.error("Erreur lors du chargement des fermetures:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fermetures temporaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    if (!formData.closure_date) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const closureData = {
        closure_date: formData.closure_date,
        reason: formData.reason || undefined,
        is_all_day: formData.is_all_day,
        start_time: formData.is_all_day ? undefined : formData.start_time,
        end_time: formData.is_all_day ? undefined : formData.end_time,
      };

      const success = await addRestaurantClosure(currentRestaurant.id, closureData);
      
      if (success) {
        toast({
          title: "Fermeture ajoutée",
          description: "La fermeture temporaire a été ajoutée avec succès",
        });
        
        // Réinitialiser le formulaire
        setFormData({
          closure_date: '',
          reason: '',
          is_all_day: true,
          start_time: '09:00',
          end_time: '18:00'
        });
        setShowForm(false);
        
        // Recharger les fermetures
        fetchClosures();
      } else {
        throw new Error("Échec de l'ajout");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la fermeture:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la fermeture temporaire",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (closureId: string) => {
    try {
      const success = await deleteRestaurantClosure(closureId);
      
      if (success) {
        toast({
          title: "Fermeture supprimée",
          description: "La fermeture temporaire a été supprimée avec succès",
        });
        fetchClosures();
      } else {
        throw new Error("Échec de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la fermeture temporaire",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchClosures();
  }, [currentRestaurant]);

  if (!currentRestaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fermetures temporaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Veuillez sélectionner un restaurant pour gérer ses fermetures temporaires.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fermetures temporaires - {currentRestaurant.name}
          </span>
          <Button 
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une fermeture
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {showForm && (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="closure_date">Date de fermeture</Label>
                        <Input
                          id="closure_date"
                          type="date"
                          value={formData.closure_date}
                          onChange={(e) => setFormData({...formData, closure_date: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reason">Raison (optionnel)</Label>
                        <Input
                          id="reason"
                          type="text"
                          placeholder="Ex: Jour férié, congés..."
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_all_day"
                        checked={formData.is_all_day}
                        onCheckedChange={(checked) => setFormData({...formData, is_all_day: checked as boolean})}
                      />
                      <Label htmlFor="is_all_day">Fermeture toute la journée</Label>
                    </div>

                    {!formData.is_all_day && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_time">Heure de début</Label>
                          <Input
                            id="start_time"
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">Heure de fin</Label>
                          <Input
                            id="end_time"
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Ajout..." : "Ajouter"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {closures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune fermeture temporaire programmée
              </div>
            ) : (
              <div className="space-y-4">
                {closures.map((closure) => (
                  <Card key={closure.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {formatDate(closure.closure_date)}
                          </h4>
                          {closure.reason && (
                            <p className="text-sm text-gray-600 mt-1">{closure.reason}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {closure.is_all_day 
                              ? "Fermé toute la journée" 
                              : `Fermé de ${closure.start_time} à ${closure.end_time}`
                            }
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(closure.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantClosuresManager;
