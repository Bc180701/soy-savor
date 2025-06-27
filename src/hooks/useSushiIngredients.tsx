
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SushiOption } from "@/types/sushi-creator";

export const useSushiIngredients = () => {
  const [enrobageOptions, setEnrobageOptions] = useState<SushiOption[]>([]);
  const [baseOptions, setBaseOptions] = useState<SushiOption[]>([]);
  const [garnituresOptions, setGarnituresOptions] = useState<SushiOption[]>([]);
  const [toppingOptions, setToppingOptions] = useState<SushiOption[]>([]);
  const [sauceOptions, setSauceOptions] = useState<SushiOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        console.log("Fetching sushi ingredients from database...");
        
        const { data: ingredients, error } = await supabase
          .from('sushi_ingredients')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching sushi ingredients:', error);
          toast.error("Impossible de charger les ingrédients");
          return;
        }

        console.log("Raw sushi ingredients data:", ingredients);

        if (!ingredients || ingredients.length === 0) {
          console.log("No sushi ingredients found in database");
          toast.error("Aucun ingrédient trouvé dans la base de données");
          return;
        }

        // Transform ingredients to SushiOption format and group by type
        const transformedIngredients: SushiOption[] = ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          price: ingredient.price,
          included: ingredient.included,
          category: ingredient.ingredient_type
        }));

        console.log("Transformed sushi ingredients:", transformedIngredients);

        // Group ingredients by type
        const enrobage = transformedIngredients.filter(ing => ing.category === 'enrobage');
        const base = transformedIngredients.filter(ing => ing.category === 'protein');
        const garnitures = transformedIngredients.filter(ing => ing.category === 'ingredient');
        const topping = transformedIngredients.filter(ing => ing.category === 'topping');
        const sauce = transformedIngredients.filter(ing => ing.category === 'sauce');

        console.log("Sushi ingredients grouped by category:", { 
          enrobage: enrobage.length, 
          base: base.length, 
          garnitures: garnitures.length, 
          topping: topping.length, 
          sauce: sauce.length 
        });

        setEnrobageOptions(enrobage);
        setBaseOptions(base);
        setGarnituresOptions(garnitures);
        setToppingOptions(topping);
        setSauceOptions(sauce);

        console.log("Sushi ingredients state updated successfully");

      } catch (error) {
        console.error('Error in fetchIngredients:', error);
        toast.error("Une erreur est survenue lors du chargement des ingrédients");
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  return {
    enrobageOptions,
    baseOptions,
    garnituresOptions,
    toppingOptions,
    sauceOptions,
    loading
  };
};
