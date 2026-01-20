
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
  enrobage: SushiOption | null;
  base: SushiOption | null;
  garnitures: SushiOption[];
  toppings: SushiOption[];
  sauce: SushiOption | null;
}
