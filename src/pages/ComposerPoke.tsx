import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";
import { Restaurant } from "@/types/restaurant";
import { PokeIngredient } from "@/types/poke-creator";
import { calculateTotalPokePrice } from "@/utils/poke-calculator";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantSelector } from "@/components/creation/RestaurantSelector";
import { IngredientQuantitySelector } from "@/components/poke/IngredientQuantitySelector";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface ComposerPokeState {
  baseItem: MenuItem;
}

// Using PokeIngredient from types

const ComposerPoke = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCart();
  const { currentRestaurant } = useRestaurantContext();

  const { baseItem } = (location.state as ComposerPokeState) || { baseItem: null };
  
  // Si un restaurant est déjà sélectionné, on saute l'étape restaurant
  const hasInitialRestaurant = !!currentRestaurant;
  const [step, setStep] = useState<number>(hasInitialRestaurant ? 1 : 0);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(currentRestaurant);
  
  // Synchroniser avec le contexte si le restaurant change
  useEffect(() => {
    if (currentRestaurant && !selectedRestaurant) {
      setSelectedRestaurant(currentRestaurant);
      if (step === 0) setStep(1);
    }
  }, [currentRestaurant]);
  // Nouveau système avec quantités
  interface IngredientWithQuantity {
    ingredient: PokeIngredient;
    quantity: number;
  }

  const [selectedIngredients, setSelectedIngredients] = useState<IngredientWithQuantity[]>([]);
  const [selectedProteins, setSelectedProteins] = useState<IngredientWithQuantity[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<IngredientWithQuantity[]>([]);

  // Ingredient options from database
  const [ingredientOptions, setIngredientOptions] = useState<PokeIngredient[]>([]);
  const [proteinOptions, setProteinOptions] = useState<PokeIngredient[]>([]);
  const [sauceOptions, setSauceOptions] = useState<PokeIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Base price
  const basePrice = 15.9;

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      try {
        // Charger les ingrédients
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('poke_ingredients')
          .select('*')
          .eq('ingredient_type', 'ingredient')
          .order('name');
        
        if (ingredientsError) throw ingredientsError;
        
        // Charger les protéines
        const { data: proteins, error: proteinsError } = await supabase
          .from('poke_ingredients')
          .select('*')
          .eq('ingredient_type', 'protein')
          .order('name');
        
        if (proteinsError) throw proteinsError;
        
        // Charger les sauces
        const { data: sauces, error: saucesError } = await supabase
          .from('poke_ingredients')
          .select('*')
          .eq('ingredient_type', 'sauce')
          .order('name');
        
        if (saucesError) throw saucesError;
        
        setIngredientOptions(ingredients || []);
        setProteinOptions(proteins || []);
        setSauceOptions(sauces || []);
      } catch (error) {
        console.error("Erreur lors du chargement des ingrédients:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les ingrédients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [toast]);

  // Calculate total price using the new pricing system with quantities
  const calculateTotalPrice = () => {
    let total = basePrice;
    console.log('💰 Calcul du prix - Prix de base:', basePrice);
    
    // Calculer le coût des ingrédients avec quantités
    // Pour les ingrédients, on compte 1€ par ingrédient supplémentaire au-delà de 5
    const totalIngredientQuantity = selectedIngredients.reduce((sum, item) => sum + item.quantity, 0);
    const extraIngredients = Math.max(0, totalIngredientQuantity - 5);
    const ingredientCost = extraIngredients * 1.0; // 1€ par ingrédient supplémentaire
    total += ingredientCost;
    console.log('🥗 Total ingrédients:', totalIngredientQuantity, 'Supplémentaires:', extraIngredients, 'Coût:', ingredientCost);
    
    // Calculer le coût des protéines avec quantités
    // Pour les protéines, on compte 1€ par protéine supplémentaire au-delà de 1
    const totalProteinQuantity = selectedProteins.reduce((sum, item) => sum + item.quantity, 0);
    const extraProteins = Math.max(0, totalProteinQuantity - 1);
    const proteinCost = extraProteins * 1.0; // 1€ par protéine supplémentaire
    total += proteinCost;
    console.log('🥩 Total protéines:', totalProteinQuantity, 'Supplémentaires:', extraProteins, 'Coût:', proteinCost);
    
    // Calculer le coût des sauces avec quantités
    // Pour les sauces, on compte 1€ par sauce supplémentaire au-delà de 1
    const totalSauceQuantity = selectedSauces.reduce((sum, item) => sum + item.quantity, 0);
    const extraSauces = Math.max(0, totalSauceQuantity - 1);
    const sauceCost = extraSauces * 1.0; // 1€ par sauce supplémentaire
    total += sauceCost;
    console.log('🥄 Total sauces:', totalSauceQuantity, 'Supplémentaires:', extraSauces, 'Coût:', sauceCost);
    
    console.log('💰 Prix total calculé:', total);
    return total;
  };

  // Navigate to next step or complete order
  const handleNext = () => {
    if (step === 0) {
      // Validation de la sélection de restaurant
      if (!selectedRestaurant) {
        toast({
          title: "Restaurant requis",
          description: "Veuillez sélectionner un restaurant",
          variant: "destructive",
        });
        return;
      }
      setStep(1);
      return;
    }

    // Validation for each step
    const totalIngredientQuantity = selectedIngredients.reduce((sum, item) => sum + item.quantity, 0);
    if (step === 1 && totalIngredientQuantity < 5) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner au moins 5 ingrédients au total",
        variant: "destructive",
      });
      return;
    }
    
    const totalProteinQuantity = selectedProteins.reduce((sum, item) => sum + item.quantity, 0);
    if (step === 2 && totalProteinQuantity < 1) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner au moins 1 protéine",
        variant: "destructive",
      });
      return;
    }

    // Step 3 (sauce) - validate and add to cart
    if (step === 3) {
      const totalSauceQuantity = selectedSauces.reduce((sum, item) => sum + item.quantity, 0);
      if (totalSauceQuantity < 1) {
        toast({
          title: "Sélection incomplète",
          description: "Veuillez sélectionner au moins 1 sauce",
          variant: "destructive",
        });
        return;
      }
      
      // Create custom poke bowl item
      const ingredientsText = selectedIngredients.map(g => `${g.quantity}x ${g.ingredient.name}`).join(', ');
      const proteinsText = selectedProteins.map(p => `${p.quantity}x ${p.ingredient.name}`).join(', ');
      const saucesText = selectedSauces.map(s => `${s.quantity}x ${s.ingredient.name}`).join(', ');
      
      const description = `Ingrédients: ${ingredientsText}, Protéines: ${proteinsText}, Sauces: ${saucesText}`;
      
      // Générer un ID unique basé sur la composition du poke bowl
      const generatePokeId = () => {
        const composition = {
          ingredients: selectedIngredients.map(i => `${i.quantity}x${i.ingredient.id}`).sort(),
          proteins: selectedProteins.map(p => `${p.quantity}x${p.ingredient.id}`).sort(),
          sauces: selectedSauces.map(s => `${s.quantity}x${s.ingredient.id}`).sort(),
          restaurant: selectedRestaurant?.id
        };
        
        // Créer un hash simple basé sur la composition
        const compositionString = JSON.stringify(composition);
        let hash = 0;
        for (let i = 0; i < compositionString.length; i++) {
          const char = compositionString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        
        // Retourner un ID positif avec un préfixe
        return `poke-crea-${Math.abs(hash)}`;
      };
      
      const uniqueId = generatePokeId();
      
      console.log('🍱 Création du poke bowl personnalisé:');
      console.log('🆔 ID unique:', uniqueId);
      console.log('📝 Description:', description);
      console.log('💰 Prix:', calculateTotalPrice());
      console.log('🏪 Restaurant:', selectedRestaurant?.name);
      
      const customPokeItem: MenuItem = {
        id: uniqueId,
        name: `Poké Créa #${uniqueId.split('-')[2]?.slice(0, 6) || '000000'}`,
        description: description,
        price: calculateTotalPrice(),
        category: "poke_custom",
        restaurant_id: selectedRestaurant?.id
      };
      
      // Add to cart with restaurant
      cart.addItemWithRestaurant(customPokeItem, 1, selectedRestaurant!.id);
      
      toast({
        title: "Personnalisation réussie !",
        description: `Votre poké bowl personnalisé a été ajouté au panier pour ${selectedRestaurant?.name}`,
      });
      
      // Navigate back to menu
      navigate("/commander");
      return;
    }

    // Continue to next step for steps 1 and 2
    setStep(step + 1);
  };

  // Get current step content
  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
        </div>
      );
    }
    
    switch (step) {
      case 0:
        return <RestaurantSelector selectedRestaurant={selectedRestaurant} onSelectRestaurant={setSelectedRestaurant} />;
      case 1:
        return (
          <IngredientQuantitySelector
            ingredients={ingredientOptions}
            selectedIngredients={selectedIngredients}
            onIngredientChange={setSelectedIngredients}
            minIngredients={5}
            title="1 : Ingrédients (5 minimum)"
            description="Sélectionnez vos ingrédients préférés. Vous pouvez doubler certains ingrédients pour atteindre le minimum de 5."
            showPricing={true}
          />
        );
      
      case 2:
        return (
          <IngredientQuantitySelector
            ingredients={proteinOptions}
            selectedIngredients={selectedProteins}
            onIngredientChange={setSelectedProteins}
            minIngredients={1}
            title="2 : Protéines (1 minimum)"
            description="Choisissez vos protéines. Vous pouvez en prendre plusieurs ou doubler la même."
            showPricing={true}
          />
        );
      
      case 3:
        return (
          <IngredientQuantitySelector
            ingredients={sauceOptions}
            selectedIngredients={selectedSauces}
            onIngredientChange={setSelectedSauces}
            minIngredients={1}
            title="3 : Sauces (1 minimum)"
            description="Sélectionnez vos sauces. Vous pouvez en prendre plusieurs ou doubler la même."
            showPricing={true}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/commander")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au menu
        </Button>

        <h1 className="text-3xl font-bold mb-2">POKÉ CRÉA</h1>
        <p className="text-gray-600 mb-6">Composez votre Poké bowl sur mesure selon vos envies ! (6 ingrédients, 1 protéine, 1 sauce minimum, +1€ par supplémentaire)</p>

        {/* Show selected restaurant */}
        {selectedRestaurant && step > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">Restaurant sélectionné :</span> {selectedRestaurant.name}
            </p>
          </div>
        )}

        <div className="flex mb-6 overflow-x-auto">
          {(hasInitialRestaurant ? [1, 2, 3] : [0, 1, 2, 3]).map((stepNumber, index) => (
            <div 
              key={stepNumber}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-2 ${
                stepNumber === step 
                  ? "bg-gold-500 text-white" 
                  : stepNumber < step 
                  ? "bg-green-500 text-white" 
                  : "bg-gray-200"
              }`}
            >
              {stepNumber < step ? (
                <Check className="h-5 w-5" />
              ) : (
                stepNumber === 0 ? "R" : (hasInitialRestaurant ? index + 1 : stepNumber)
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {step === 0 ? "Restaurant" : `Étape ${hasInitialRestaurant ? step : step}/3`}
              </h2>
              {step > 0 && (
                <div className="text-right">
                  <p className="text-sm">Total:</p>
                  <p className="text-xl font-bold text-gold-600">
                    {calculateTotalPrice().toFixed(2)}€
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
            
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (hasInitialRestaurant && step === 1) {
                    navigate("/commander");
                  } else if (step > 0) {
                    setStep(step - 1);
                  } else {
                    navigate("/commander");
                  }
                }}
              >
                {(hasInitialRestaurant && step === 1) || step === 0 ? "Annuler" : "Précédent"}
              </Button>
              <Button onClick={handleNext}>
                {step === 0 ? "Continuer" : step < 3 ? "Continuer" : "Ajouter au panier"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {step === 3 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Récapitulatif de votre création</h3>
            <Card>
              <CardContent className="mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">Ingrédients:</span>
                    <span className="text-right">
                      {selectedIngredients.map(i => i.ingredient.name).join(', ')}
                    </span>
                  </div>
                  {selectedProteins.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">Protéines:</span>
                      <span className="text-right">
                        {selectedProteins.map(p => p.ingredient.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {selectedSauces.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">Sauces:</span>
                      <span className="text-right">
                        {selectedSauces.map(s => s.ingredient.name).join(', ')}
                      </span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-gold-600">{calculateTotalPrice().toFixed(2)}€</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ComposerPoke;
