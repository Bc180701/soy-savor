
import { SushiOption, SushiCreation, BoxOption } from "@/types/sushi-creator";

export const calculateCreationExtraCost = (
  enrobage: SushiOption | null,
  bases: SushiOption[] = [],
  garnitures: SushiOption[],
  toppings: SushiOption[] = []
) => {
  let extraCost = 0;

  // Extra cost for enrobage
  if (enrobage && !enrobage.included) {
    extraCost += enrobage.price;
  }

  // Extra cost for bases (first 1 included, +0.50€ for 2nd, max 2)
  if (bases.length > 1) {
    extraCost += 0.5;
  }

  // Extra cost for garnitures (first 1 included, +0.50€ per extra)
  if (garnitures.length > 1) {
    extraCost += (garnitures.length - 1) * 0.5;
  }

  // Extra cost for toppings (first 1 included, +0.50€ per extra)
  if (toppings.length > 1) {
    extraCost += (toppings.length - 1) * 0.5;
  }

  return extraCost;
};

export const calculateTotalExtraCost = (
  completedCreations: SushiCreation[],
  currentEnrobage: SushiOption | null,
  currentBases: SushiOption[] = [],
  currentGarnitures: SushiOption[],
  currentToppings: SushiOption[] = []
) => {
  let totalExtraCost = 0;
  
  // Add extra costs from completed creations
  completedCreations.forEach(creation => {
    if (creation.enrobage && !creation.enrobage.included) {
      totalExtraCost += creation.enrobage.price;
    }
    // Bases: 1 incluse, +0.50€ pour la 2ème
    const creationBases = creation.bases || [];
    if (creationBases.length > 1) {
      totalExtraCost += 0.5;
    }
    if (creation.garnitures.length > 1) {
      totalExtraCost += (creation.garnitures.length - 1) * 0.5;
    }
    // Toppings: 1 inclus, +0.50€ par ajout
    const creationToppings = creation.toppings || [];
    if (creationToppings.length > 1) {
      totalExtraCost += (creationToppings.length - 1) * 0.5;
    }
  });
  
  // Add current creation extra cost
  totalExtraCost += calculateCreationExtraCost(currentEnrobage, currentBases, currentGarnitures, currentToppings);
  
  return totalExtraCost;
};

export const calculateTotalPrice = (
  selectedBox: BoxOption | null,
  totalExtraCost: number
) => {
  if (!selectedBox) return 0;
  return selectedBox.price + totalExtraCost;
};
