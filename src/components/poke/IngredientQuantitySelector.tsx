import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus } from 'lucide-react';
import { PokeIngredient } from '@/hooks/usePokeIngredients';

interface IngredientWithQuantity {
  ingredient: PokeIngredient;
  quantity: number;
}

interface IngredientQuantitySelectorProps {
  ingredients: PokeIngredient[];
  selectedIngredients: IngredientWithQuantity[];
  onIngredientChange: (ingredients: IngredientWithQuantity[]) => void;
  minIngredients: number;
  maxIngredients?: number;
  title: string;
  description?: string;
  showPricing?: boolean;
}

export const IngredientQuantitySelector: React.FC<IngredientQuantitySelectorProps> = ({
  ingredients,
  selectedIngredients,
  onIngredientChange,
  minIngredients,
  maxIngredients,
  title,
  description,
  showPricing = true
}) => {
  // Calculer le total d'ingrédients sélectionnés
  const totalSelectedQuantity = selectedIngredients.reduce((sum, item) => sum + item.quantity, 0);

  // Vérifier si un ingrédient est sélectionné
  const isIngredientSelected = (ingredientId: string) => {
    return selectedIngredients.some(item => item.ingredient.id === ingredientId);
  };

  // Obtenir la quantité d'un ingrédient
  const getIngredientQuantity = (ingredientId: string) => {
    const item = selectedIngredients.find(item => item.ingredient.id === ingredientId);
    return item ? item.quantity : 0;
  };

  // Ajouter ou augmenter la quantité d'un ingrédient
  const addIngredient = (ingredient: PokeIngredient) => {
    const existingItem = selectedIngredients.find(item => item.ingredient.id === ingredient.id);
    
    if (existingItem) {
      // Augmenter la quantité si l'ingrédient existe déjà
      const newQuantity = existingItem.quantity + 1;
      const updatedIngredients = selectedIngredients.map(item =>
        item.ingredient.id === ingredient.id
          ? { ...item, quantity: newQuantity }
          : item
      );
      onIngredientChange(updatedIngredients);
    } else {
      // Ajouter l'ingrédient avec quantité 1
      const newIngredients = [...selectedIngredients, { ingredient, quantity: 1 }];
      onIngredientChange(newIngredients);
    }
  };

  // Diminuer la quantité d'un ingrédient
  const removeIngredient = (ingredientId: string) => {
    const existingItem = selectedIngredients.find(item => item.ingredient.id === ingredientId);
    
    if (existingItem) {
      if (existingItem.quantity > 1) {
        // Diminuer la quantité
        const updatedIngredients = selectedIngredients.map(item =>
          item.ingredient.id === ingredientId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
        onIngredientChange(updatedIngredients);
      } else {
        // Supprimer complètement l'ingrédient
        const updatedIngredients = selectedIngredients.filter(item => item.ingredient.id !== ingredientId);
        onIngredientChange(updatedIngredients);
      }
    }
  };

  // Calculer le prix total des ingrédients supplémentaires
  const calculateExtraCost = () => {
    const totalQuantity = selectedIngredients.reduce((sum, item) => sum + item.quantity, 0);
    const extraQuantity = Math.max(0, totalQuantity - minIngredients);
    const totalCost = extraQuantity * 1.0; // 1€ par ingrédient supplémentaire
    
    console.log('🔍 [IngredientQuantitySelector] Total quantité:', totalQuantity, 'Minimum:', minIngredients, 'Supplémentaires:', extraQuantity, 'Coût:', totalCost);
    return totalCost;
  };

  const extraCost = calculateExtraCost();
  const isMinimumReached = totalSelectedQuantity >= minIngredients;
  const isMaximumReached = maxIngredients ? totalSelectedQuantity >= maxIngredients : false;

  return (
    <div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ingredients.map((ingredient) => {
          const isSelected = isIngredientSelected(ingredient.id);
          const quantity = getIngredientQuantity(ingredient.id);
          
          return (
            <Card key={ingredient.id} className={`transition-all duration-200 ${
              isSelected ? 'ring-2 ring-gold-500 bg-gold-50' : 'hover:shadow-md'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label className="font-medium text-sm">
                        {ingredient.name}
                      </Label>
                      {showPricing && !ingredient.included && ingredient.price > 0 && (
                        <span className="text-gold-600 text-xs">
                          +{ingredient.price.toFixed(2)}€
                        </span>
                      )}
                      {showPricing && ingredient.included && (
                        <span className="text-green-600 text-xs">
                          Inclus
                        </span>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {quantity}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addIngredient(ingredient)}
                          disabled={isMaximumReached && !isSelected}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!isSelected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addIngredient(ingredient)}
                      disabled={isMaximumReached}
                      className="ml-2"
                    >
                      Ajouter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Résumé et validation */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Total d'ingrédients sélectionnés: {totalSelectedQuantity}
          </span>
          {maxIngredients && (
            <span className="text-xs text-gray-500">
              Maximum: {maxIngredients}
            </span>
          )}
        </div>
        
        <div className="text-sm">
          {!isMinimumReached ? (
            <p className="text-amber-600">
              ⚠️ Sélectionnez encore {minIngredients - totalSelectedQuantity} ingrédient(s) minimum
            </p>
          ) : totalSelectedQuantity > minIngredients ? (
            <p className="text-gold-600">
              ✅ {totalSelectedQuantity - minIngredients} ingrédient(s) supplémentaire(s) sélectionné(s)
            </p>
          ) : (
            <p className="text-green-600">
              ✅ {minIngredients} ingrédient(s) minimum atteint
            </p>
          )}
        </div>

        {showPricing && extraCost > 0 && (
          <div className="mt-2 text-sm font-medium text-gold-600">
            Coût supplémentaire: +{extraCost.toFixed(2)}€
          </div>
        )}
      </div>
    </div>
  );
};
