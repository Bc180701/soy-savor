export interface PokeIngredient {
  id: string;
  name: string;
  price: number;
  included: boolean;
  ingredient_type: string;
}

export interface PokeCreation {
  ingredients: PokeIngredient[];
  proteins: PokeIngredient[];
  sauces: PokeIngredient[];
}