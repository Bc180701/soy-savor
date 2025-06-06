
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SushiOption } from "@/types/sushi-creator";

export const useSushiIngredients = () => {
  const [enrobageOptions, setEnrobageOptions] = useState<SushiOption[]>([]);
  const [baseOptions, setBaseOptions] = useState<SushiOption[]>([]);
  const [garnituresOptions, setGarnituresOptions] = useState<SushiOption[]>([]);
  const [toppingOptions, setToppingOptions] = useState<SushiOption[]>([]);
  const [sauceOptions, setSauceOptions] = useState<SushiOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
          toast({
            title: "Erreur",
            description: "Impossible de charger les ingrédients",
            variant: "destructive",
          });
          return;
        }

        console.log("Sushi ingredients fetched:", ingredients);

        // Transform ingredients to SushiOption format and group by type
        const transformedIngredients = ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          price: ingredient.price,
          included: ingredient.included,
          category: ingredient.ingredient_type
        }));

        // Group ingredients by type
        setEnrobageOptions(transformedIngredients.filter(ing => ing.category === 'enrobage'));
        setBaseOptions(transformedIngredients.filter(ing => ing.category === 'protein'));
        setGarnituresOptions(transformedIngredients.filter(ing => ing.category === 'ingredient'));
        setToppingOptions(transformedIngredients.filter(ing => ing.category === 'topping'));
        setSauceOptions(transformedIngredients.filter(ing => ing.category === 'sauce'));

      } catch (error) {
        console.error('Error in fetchIngredients:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des ingrédients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [toast]);

  return {
    enrobageOptions,
    baseOptions,
    garnituresOptions,
    toppingOptions,
    sauceOptions,
    loading
  };
};
