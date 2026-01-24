import { PokeIngredient } from "@/types/poke-creator";

export const calculatePokeExtraCost = (ingredients: PokeIngredient[]) => {
  let extraCost = 0;

  // Ingrédients au-delà de 5 coûtent 0.50€ chaque (étape 1)
  if (ingredients.length > 5) {
    extraCost += (ingredients.length - 5) * 0.5;
  }

  // Ajouter les coûts des ingrédients premium
  ingredients.forEach(ingredient => {
    if (!ingredient.included) {
      extraCost += ingredient.price;
    }
  });

  return extraCost;
};

export const calculatePokeProteinExtraCost = (proteins: PokeIngredient[]) => {
  let extraCost = 0;

  // Protéines au-delà de 1 coûtent 1€ chaque (étape 2)
  if (proteins.length > 1) {
    extraCost += (proteins.length - 1) * 1;
  }

  // Ajouter les coûts des protéines premium
  proteins.forEach(protein => {
    if (!protein.included) {
      extraCost += protein.price;
    }
  });

  return extraCost;
};

export const calculatePokeSauceExtraCost = (sauces: PokeIngredient[]) => {
  let extraCost = 0;

  // Sauces au-delà de 1 coûtent 1€ chaque
  if (sauces.length > 1) {
    extraCost += (sauces.length - 1) * 1;
  }

  // Ajouter les coûts des sauces premium
  sauces.forEach(sauce => {
    if (!sauce.included) {
      extraCost += sauce.price;
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
  totalExtraCost += calculatePokeProteinExtraCost(proteins);
  totalExtraCost += calculatePokeSauceExtraCost(sauces);

  return basePrice + totalExtraCost;
};