
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

interface ComposerPokeState {
  baseItem: MenuItem;
}

// Using PokeIngredient from types

const ComposerPoke = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCart();

  const { baseItem } = (location.state as ComposerPokeState) || { baseItem: null };
  
  const [step, setStep] = useState<number>(0); // Commencer à 0 pour la sélection de restaurant
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
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
    
    // Calculer le coût des ingrédients avec quantités
    selectedIngredients.forEach(item => {
      if (!item.ingredient.included) {
        total += item.ingredient.price * item.quantity;
      } else {
        // Pour les ingrédients inclus, on ne compte que les quantités au-delà de 1
        const extraQuantity = Math.max(0, item.quantity - 1);
        total += item.ingredient.price * extraQuantity;
      }
    });
    
    // Calculer le coût des protéines avec quantités
    selectedProteins.forEach(item => {
      if (!item.ingredient.included) {
        total += item.ingredient.price * item.quantity;
      } else {
        const extraQuantity = Math.max(0, item.quantity - 1);
        total += item.ingredient.price * extraQuantity;
      }
    });
    
    // Calculer le coût des sauces avec quantités
    selectedSauces.forEach(item => {
      if (!item.ingredient.included) {
        total += item.ingredient.price * item.quantity;
      } else {
        const extraQuantity = Math.max(0, item.quantity - 1);
        total += item.ingredient.price * extraQuantity;
      }
    });
    
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

    if (step < 4) {
      // Validation for each step - minimum 5 ingredients (total quantity)
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

      setStep(step + 1);
    } else {
      // Step 3 (sauce) - add to cart and complete
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
      const customPokeItem: MenuItem = {
        id: `custom-poke-${Date.now()}`,
        name: `Poké Créa`,
        description: `Ingrédients: ${selectedIngredients.map(g => `${g.quantity}x ${g.ingredient.name}`).join(', ')}, Protéines: ${selectedProteins.map(p => `${p.quantity}x ${p.ingredient.name}`).join(', ')}, Sauces: ${selectedSauces.map(s => `${s.quantity}x ${s.ingredient.name}`).join(', ')}`,
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
    }
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
          {[0, 1, 2, 3].map((stepNumber) => (
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
                stepNumber === 0 ? "R" : stepNumber
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {step === 0 ? "Restaurant" : `Étape ${step}/3`}
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
                onClick={() => step > 0 ? setStep(step - 1) : navigate("/commander")}
              >
                {step > 0 ? "Précédent" : "Annuler"}
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
                      {selectedIngredients.map(i => i.name).join(', ')}
                    </span>
                  </div>
                  {selectedProteins.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">Protéines:</span>
                      <span className="text-right">
                        {selectedProteins.map(p => p.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {selectedSauces.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">Sauces:</span>
                      <span className="text-right">
                        {selectedSauces.map(s => s.name).join(', ')}
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
