
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Edit } from "lucide-react";

interface SushiIngredient {
  id: string;
  name: string;
  price: number;
  included: boolean;
  ingredient_type: string;
  created_at: string;
  updated_at: string;
}

const SushiIngredientsManager = () => {
  const [ingredients, setIngredients] = useState<SushiIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    included: true,
    ingredient_type: "ingredient"
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const ingredientTypes = [
    { value: "protein", label: "Protéine" },
    { value: "ingredient", label: "Ingrédient" },
    { value: "sauce", label: "Sauce" }
  ];

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sushi_ingredients')
        .select('*')
        .order('ingredient_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des ingrédients:', error);
      toast.error("Erreur lors du chargement des ingrédients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Le nom de l'ingrédient est requis");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('sushi_ingredients')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success("Ingrédient modifié avec succès");
      } else {
        const { error } = await supabase
          .from('sushi_ingredients')
          .insert([formData]);

        if (error) throw error;
        toast.success("Ingrédient ajouté avec succès");
      }

      setFormData({
        name: "",
        price: 0,
        included: true,
        ingredient_type: "ingredient"
      });
      setEditingId(null);
      fetchIngredients();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (ingredient: SushiIngredient) => {
    setFormData({
      name: ingredient.name,
      price: ingredient.price,
      included: ingredient.included,
      ingredient_type: ingredient.ingredient_type
    });
    setEditingId(ingredient.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sushi_ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Ingrédient supprimé avec succès");
      fetchIngredients();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: "",
      price: 0,
      included: true,
      ingredient_type: "ingredient"
    });
    setEditingId(null);
  };

  const getTypeLabel = (type: string) => {
    const typeObj = ingredientTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de l'ingrédient</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Saumon, Avocat..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Prix (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ingredient_type">Type d'ingrédient</Label>
                <Select
                  value={formData.ingredient_type}
                  onValueChange={(value) => setFormData({ ...formData, ingredient_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="included"
                  checked={formData.included}
                  onCheckedChange={(checked) => setFormData({ ...formData, included: checked })}
                />
                <Label htmlFor="included">Inclus de base</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? "Modifier" : "Ajouter"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingrédients existants ({ingredients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{ingredient.name}</h3>
                    <p className="text-sm text-gray-600">
                      {getTypeLabel(ingredient.ingredient_type)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(ingredient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(ingredient.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Prix:</span> {ingredient.price.toFixed(2)}€
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Inclus:</span>{" "}
                    <span className={ingredient.included ? "text-green-600" : "text-red-600"}>
                      {ingredient.included ? "Oui" : "Non"}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {ingredients.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Aucun ingrédient trouvé. Ajoutez-en un pour commencer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SushiIngredientsManager;
