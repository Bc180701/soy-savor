
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PokeIngredient {
  id: string;
  name: string;
  price: number;
  included: boolean;
  ingredient_type: string;
}

export const usePokeIngredients = () => {
  const [baseOptions, setBaseOptions] = useState<PokeIngredient[]>([]);
  const [proteinOptions, setProteinOptions] = useState<PokeIngredient[]>([]);
  const [vegetableOptions, setVegetableOptions] = useState<PokeIngredient[]>([]);
  const [toppingOptions, setToppingOptions] = useState<PokeIngredient[]>([]);
  const [sauceOptions, setSauceOptions] = useState<PokeIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        console.log("Fetching poke ingredients from database...");
        
        const { data: ingredients, error } = await supabase
          .from('poke_ingredients')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching poke ingredients:', error);
          toast.error("Impossible de charger les ingrédients pokés");
          return;
        }

        console.log("Poke ingredients fetched:", ingredients);

        if (!ingredients || ingredients.length === 0) {
          console.log("No poke ingredients found in database");
          toast.error("Aucun ingrédient poké trouvé dans la base de données");
          return;
        }

        // Group ingredients by type
        const base = ingredients.filter((ing: any) => ing.ingredient_type === 'base');
        const protein = ingredients.filter((ing: any) => ing.ingredient_type === 'protein');
        const vegetable = ingredients.filter((ing: any) => ing.ingredient_type === 'vegetable');
        const topping = ingredients.filter((ing: any) => ing.ingredient_type === 'topping');
        const sauce = ingredients.filter((ing: any) => ing.ingredient_type === 'sauce');

        console.log("Poke categories:", { base: base.length, protein: protein.length, vegetable: vegetable.length, topping: topping.length, sauce: sauce.length });

        setBaseOptions(base as any);
        setProteinOptions(protein as any);
        setVegetableOptions(vegetable as any);
        setToppingOptions(topping as any);
        setSauceOptions(sauce as any);

      } catch (error) {
        console.error('Error in fetchPokeIngredients:', error);
        toast.error("Une erreur est survenue lors du chargement des ingrédients pokés");
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  return {
    baseOptions,
    proteinOptions,
    vegetableOptions,
    toppingOptions,
    sauceOptions,
    loading
  };
};
