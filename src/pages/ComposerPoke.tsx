
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";
import { Restaurant } from "@/types/restaurant";
import { PokeIngredient } from "@/types/poke-creator";
import { calculateTotalPokePrice } from "@/utils/poke-calculator";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantSelector } from "@/components/creation/RestaurantSelector";

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
  const [selectedIngredients, setSelectedIngredients] = useState<PokeIngredient[]>([]);
  const [selectedProteins, setSelectedProteins] = useState<PokeIngredient[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<PokeIngredient[]>([]);

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

  // Handle ingredient selection (unlimited, but cost extra after 6)
  const handleSelectionToggle = (
    option: PokeIngredient, 
    selectedList: PokeIngredient[], 
    setSelectedList: React.Dispatch<React.SetStateAction<PokeIngredient[]>>,
    categoryName: string
  ) => {
    const isAlreadySelected = selectedList.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      // Remove if already selected
      setSelectedList(selectedList.filter(item => item.id !== option.id));
    } else {
      // Add the ingredient
      setSelectedList([...selectedList, option]);
    }
  };

  // Calculate total price using the new pricing system
  const calculateTotalPrice = () => {
    return calculateTotalPokePrice(basePrice, selectedIngredients, selectedProteins, selectedSauces);
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
      // Validation for each step - minimum 6 ingredients
      if (step === 1 && selectedIngredients.length < 6) {
        toast({
          title: "Sélection incomplète",
          description: "Veuillez sélectionner au moins 6 ingrédients",
          variant: "destructive",
        });
        return;
      }
      
      if (step === 2 && selectedProteins.length < 6) {
        toast({
          title: "Sélection incomplète",
          description: "Veuillez sélectionner au moins 6 protéines",
          variant: "destructive",
        });
        return;
      }

      setStep(step + 1);
    } else {
      // Step 3 (sauce) - add to cart and complete
      if (selectedSauces.length < 6) {
        toast({
          title: "Sélection incomplète",
          description: "Veuillez sélectionner au moins 6 sauces",
          variant: "destructive",
        });
        return;
      }
      
      // Create custom poke bowl item
      const customPokeItem: MenuItem = {
        id: `custom-poke-${Date.now()}`,
        name: `Poké Créa`,
        description: `Ingrédients: ${selectedIngredients.map(g => g.name).join(', ')}, Protéines: ${selectedProteins.map(p => p.name).join(', ')}, Sauces: ${selectedSauces.map(s => s.name).join(', ')}`,
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
          <div>
            <h3 className="text-xl font-bold mb-4">1 : Ingrédients (6 minimum - +1€ par supplémentaire)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ingredientOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`ingredient-${option.id}`} 
                    checked={selectedIngredients.some(item => item.id === option.id)}
                    onCheckedChange={() => handleSelectionToggle(option, selectedIngredients, setSelectedIngredients, "ingrédients")}
                  />
                  <Label htmlFor={`ingredient-${option.id}`}>
                    {option.name}
                    {!option.included && option.price > 0 && (
                      <span className="text-gold-600 ml-1">+{option.price.toFixed(2)}€</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedIngredients.length < 6 
                ? `Sélectionnez encore ${6 - selectedIngredients.length} ingrédient(s) minimum`
                : selectedIngredients.length > 6 
                ? `+${selectedIngredients.length - 6}€ pour les ingrédients supplémentaires`
                : "6 ingrédients sélectionnés"
              }
            </p>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">2 : Protéines (6 minimum - +1€ par supplémentaire)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {proteinOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`protein-${option.id}`} 
                    checked={selectedProteins.some(item => item.id === option.id)}
                    onCheckedChange={() => handleSelectionToggle(option, selectedProteins, setSelectedProteins, "protéines")}
                  />
                  <Label htmlFor={`protein-${option.id}`}>
                    {option.name}
                    {!option.included && option.price > 0 && (
                      <span className="text-gold-600 ml-1">+{option.price.toFixed(2)}€</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedProteins.length < 6 
                ? `Sélectionnez encore ${6 - selectedProteins.length} protéine(s) minimum`
                : selectedProteins.length > 6 
                ? `+${selectedProteins.length - 6}€ pour les protéines supplémentaires`
                : "6 protéines sélectionnées"
              }
            </p>
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">3 : Sauces (6 minimum - +1€ par supplémentaire)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sauceOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`sauce-${option.id}`} 
                    checked={selectedSauces.some(item => item.id === option.id)}
                    onCheckedChange={() => handleSelectionToggle(option, selectedSauces, setSelectedSauces, "sauces")}
                  />
                  <Label htmlFor={`sauce-${option.id}`}>
                    {option.name}
                    {!option.included && option.price > 0 && (
                      <span className="text-gold-600 ml-1">+{option.price.toFixed(2)}€</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedSauces.length < 6 
                ? `Sélectionnez encore ${6 - selectedSauces.length} sauce(s) minimum`
                : selectedSauces.length > 6 
                ? `+${selectedSauces.length - 6}€ pour les sauces supplémentaires`
                : "6 sauces sélectionnées"
              }
            </p>
          </div>
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
        <p className="text-gray-600 mb-6">Composez votre Poké bowl sur mesure selon vos envies ! (6 choix minimum par catégorie, +1€ par supplémentaire)</p>

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
