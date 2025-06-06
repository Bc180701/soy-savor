
import { SushiOption, SushiCreation, BoxOption } from "@/types/sushi-creator";

export const calculateCreationExtraCost = (
  enrobage: SushiOption | null,
  garnitures: SushiOption[]
) => {
  let extraCost = 0;

  // Extra cost for enrobage
  if (enrobage && !enrobage.included) {
    extraCost += enrobage.price;
  }

  // Extra cost for garnitures (first 2 included)
  if (garnitures.length > 2) {
    extraCost += (garnitures.length - 2) * 1; // +1€ per extra garniture
  }

  return extraCost;
};

export const calculateTotalExtraCost = (
  completedCreations: SushiCreation[],
  currentEnrobage: SushiOption | null,
  currentGarnitures: SushiOption[]
) => {
  let totalExtraCost = 0;
  
  // Add extra costs from completed creations
  completedCreations.forEach(creation => {
    if (creation.enrobage && !creation.enrobage.included) {
      totalExtraCost += creation.enrobage.price;
    }
    if (creation.garnitures.length > 2) {
      totalExtraCost += (creation.garnitures.length - 2) * 1;
    }
  });
  
  // Add current creation extra cost
  totalExtraCost += calculateCreationExtraCost(currentEnrobage, currentGarnitures);
  
  return totalExtraCost;
};

export const calculateTotalPrice = (
  selectedBox: BoxOption | null,
  totalExtraCost: number
) => {
  if (!selectedBox) return 0;
  return selectedBox.price + totalExtraCost;
};
