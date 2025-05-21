
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Trash } from "lucide-react";

export interface PokeIngredient {
  id: string;
  name: string;
  price: number;
  included: boolean;
  ingredient_type: string;
}

const PokeIngredientsManager = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<PokeIngredient[]>([]);
  const [proteinOptions, setProteinOptions] = useState<PokeIngredient[]>([]);
  const [sauceOptions, setSauceOptions] = useState<PokeIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pour le formulaire d'ajout
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState(0);
  const [newIncluded, setNewIncluded] = useState(true);
  const [newType, setNewType] = useState<"ingredient" | "protein" | "sauce">("ingredient");

  // Charger les ingrédients depuis la base de données
  const fetchIngredients = async () => {
    try {
      setLoading(true);
      
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('poke_ingredients')
        .select('*')
        .eq('ingredient_type', 'ingredient')
        .order('name');
      
      const { data: proteinsData, error: proteinsError } = await supabase
        .from('poke_ingredients')
        .select('*')
        .eq('ingredient_type', 'protein')
        .order('name');
        
      const { data: saucesData, error: saucesError } = await supabase
        .from('poke_ingredients')
        .select('*')
        .eq('ingredient_type', 'sauce')
        .order('name');
      
      if (ingredientsError || proteinsError || saucesError) {
        throw new Error("Erreur lors du chargement des ingrédients");
      }
      
      setIngredients(ingredientsData as PokeIngredient[] || []);
      setProteinOptions(proteinsData as PokeIngredient[] || []);
      setSauceOptions(saucesData as PokeIngredient[] || []);
      
    } catch (error) {
      console.error("Erreur lors du chargement des ingrédients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ingrédients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Ajouter un nouvel ingrédient
  const handleAddIngredient = async () => {
    if (!newName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'ingrédient est requis",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('poke_ingredients')
        .insert({
          name: newName,
          price: newPrice,
          included: newIncluded,
          ingredient_type: newType
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Ingrédient ajouté avec succès",
      });
      
      // Réinitialiser le formulaire et rafraîchir la liste
      setNewName("");
      setNewPrice(0);
      setNewIncluded(true);
      await fetchIngredients();
      
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'ingrédient:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'ingrédient",
        variant: "destructive",
      });
    }
  };
  
  // Supprimer un ingrédient
  const handleDeleteIngredient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('poke_ingredients')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Ingrédient supprimé avec succès",
      });
      
      await fetchIngredients();
      
    } catch (error) {
      console.error("Erreur lors de la suppression de l'ingrédient:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ingrédient",
        variant: "destructive",
      });
    }
  };
  
  // Mettre à jour un ingrédient (included/price)
  const handleUpdateIngredient = async (id: string, field: string, value: boolean | number) => {
    try {
      const { error } = await supabase
        .from('poke_ingredients')
        .update({ [field]: value })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Ingrédient mis à jour avec succès",
      });
      
      await fetchIngredients();
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'ingrédient:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'ingrédient",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    fetchIngredients();
  }, []);
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un nouvel ingrédient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ingredient-name">Nom de l'ingrédient</Label>
              <Input 
                id="ingredient-name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ingredient-price">Prix supplémentaire (€)</Label>
              <Input 
                id="ingredient-price" 
                type="number" 
                min="0" 
                step="0.1"
                value={newPrice} 
                onChange={(e) => setNewPrice(parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-8 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ingredient-included" 
                checked={newIncluded} 
                onCheckedChange={(checked) => setNewIncluded(checked as boolean)}
              />
              <Label htmlFor="ingredient-included">Inclus sans supplément</Label>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="ingredient-type">Type</Label>
              <select
                id="ingredient-type"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={newType}
                onChange={(e) => setNewType(e.target.value as "ingredient" | "protein" | "sauce")}
              >
                <option value="ingredient">Ingrédient</option>
                <option value="protein">Protéine</option>
                <option value="sauce">Sauce</option>
              </select>
            </div>
          </div>
          
          <Button className="mt-4" onClick={handleAddIngredient}>
            Ajouter
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Ingrédients disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <h3 className="text-xl font-bold mb-2">Ingrédients</h3>
                {ingredients.length === 0 ? (
                  <p className="text-gray-500">Aucun ingrédient disponible</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Nom</th>
                        <th className="text-left py-2">Prix</th>
                        <th className="text-left py-2">Inclus</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ingredient) => (
                        <tr key={ingredient.id} className="border-b">
                          <td className="py-2">{ingredient.name}</td>
                          <td className="py-2">{ingredient.price}€</td>
                          <td className="py-2">
                            <Checkbox
                              checked={ingredient.included}
                              onCheckedChange={(checked) => handleUpdateIngredient(ingredient.id, 'included', checked as boolean)}
                            />
                          </td>
                          <td className="py-2">
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteIngredient(ingredient.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="overflow-x-auto">
                <h3 className="text-xl font-bold mb-2">Protéines</h3>
                {proteinOptions.length === 0 ? (
                  <p className="text-gray-500">Aucune protéine disponible</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Nom</th>
                        <th className="text-left py-2">Prix</th>
                        <th className="text-left py-2">Inclus</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {proteinOptions.map((protein) => (
                        <tr key={protein.id} className="border-b">
                          <td className="py-2">{protein.name}</td>
                          <td className="py-2">{protein.price}€</td>
                          <td className="py-2">
                            <Checkbox
                              checked={protein.included}
                              onCheckedChange={(checked) => handleUpdateIngredient(protein.id, 'included', checked as boolean)}
                            />
                          </td>
                          <td className="py-2">
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteIngredient(protein.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="overflow-x-auto">
                <h3 className="text-xl font-bold mb-2">Sauces</h3>
                {sauceOptions.length === 0 ? (
                  <p className="text-gray-500">Aucune sauce disponible</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Nom</th>
                        <th className="text-left py-2">Prix</th>
                        <th className="text-left py-2">Inclus</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sauceOptions.map((sauce) => (
                        <tr key={sauce.id} className="border-b">
                          <td className="py-2">{sauce.name}</td>
                          <td className="py-2">{sauce.price}€</td>
                          <td className="py-2">
                            <Checkbox
                              checked={sauce.included}
                              onCheckedChange={(checked) => handleUpdateIngredient(sauce.id, 'included', checked as boolean)}
                            />
                          </td>
                          <td className="py-2">
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteIngredient(sauce.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PokeIngredientsManager;
