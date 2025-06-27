
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, Edit } from "lucide-react";

interface PokeIngredient {
  id: string;
  name: string;
  price: number;
  included: boolean;
  ingredient_type: string;
}

const PokeIngredientsSection = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<PokeIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    included: true,
    ingredient_type: "ingredient"
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const ingredientTypes = [
    { value: "ingredient", label: "Ingrédient" },
    { value: "protein", label: "Protéine" },
    { value: "sauce", label: "Sauce" }
  ];

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('poke_ingredients')
        .select('*')
        .order('ingredient_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des ingrédients poke:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ingrédients poke",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'ingrédient est requis",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('poke_ingredients')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Ingrédient poke modifié avec succès",
        });
      } else {
        const { error } = await supabase
          .from('poke_ingredients')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Ingrédient poke ajouté avec succès",
        });
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
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'ingrédient",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ingredient: PokeIngredient) => {
    setFormData({
      name: ingredient.name,
      price: ingredient.price,
      included: ingredient.included,
      ingredient_type: ingredient.ingredient_type
    });
    setEditingId(ingredient.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient poke ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('poke_ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Succès",
        description: "Ingrédient poke supprimé avec succès",
      });
      fetchIngredients();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ingrédient",
        variant: "destructive",
      });
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
            {editingId ? "Modifier l'ingrédient poke" : "Ajouter un ingrédient poke"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poke-name">Nom de l'ingrédient</Label>
                <Input
                  id="poke-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Thon, Edamame..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="poke-price">Prix (€)</Label>
                <Input
                  id="poke-price"
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
                <Label htmlFor="poke-type">Type d'ingrédient</Label>
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
                  id="poke-included"
                  checked={formData.included}
                  onCheckedChange={(checked) => setFormData({ ...formData, included: checked })}
                />
                <Label htmlFor="poke-included">Inclus de base</Label>
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
          <CardTitle>Ingrédients poke existants ({ingredients.length})</CardTitle>
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
                      className="hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(ingredient.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
              Aucun ingrédient poke trouvé. Ajoutez-en un pour commencer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PokeIngredientsSection;
