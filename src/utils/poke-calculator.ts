import { PokeIngredient } from "@/types/poke-creator";

export const calculatePokeExtraCost = (ingredients: PokeIngredient[]) => {
  let extraCost = 0;

  // Ingrédients au-delà de 6 coûtent 1€ chaque
  if (ingredients.length > 6) {
    extraCost += (ingredients.length - 6) * 1;
  }

  // Ajouter les coûts des ingrédients premium
  ingredients.forEach(ingredient => {
    if (!ingredient.included) {
      extraCost += ingredient.price;
    }
  });

  return extraCost;
};

export const calculateTotalPokePrice = (
  basePrice: number,
  ingredients: PokeIngredient[],
  proteins: PokeIngredient[],
  sauces: PokeIngredient[]
) => {
  let totalExtraCost = 0;
  
  // Calculer les coûts supplémentaires pour chaque catégorie
  totalExtraCost += calculatePokeExtraCost(ingredients);
  totalExtraCost += calculatePokeExtraCost(proteins);
  totalExtraCost += calculatePokeExtraCost(sauces);

  return basePrice + totalExtraCost;
};