
export interface SushiOption {
  id: string;
  name: string;
  price: number;
  included: boolean;
  category: string;
  isSelected?: boolean;
}

export interface BoxOption {
  id: string;
  pieces: number;
  creations: number;
  price: number;
  name: string;
  description?: string;
}

export interface SushiCreation {
  enrobages: SushiOption[];
  bases: SushiOption[];
  garnitures: SushiOption[];
  toppings: SushiOption[];
  sauces: SushiOption[];
}
