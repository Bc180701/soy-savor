
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
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ComposerPokeState {
  baseItem: MenuItem;
}

interface IngredientOption {
  id: string;
  name: string;
  price: number;
  included: boolean;
}

const ComposerPoke = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCart();

  const { baseItem } = (location.state as ComposerPokeState) || { baseItem: null };
  
  const [step, setStep] = useState<number>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientOption[]>([]);
  const [selectedProteins, setSelectedProteins] = useState<IngredientOption[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<IngredientOption[]>([]);

  // Ingredient options from database
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [proteinOptions, setProteinOptions] = useState<IngredientOption[]>([]);
  const [sauceOptions, setSauceOptions] = useState<IngredientOption[]>([]);
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

  // Handle ingredient selection (max 5 for each category)
  const handleSelectionToggle = (
    option: IngredientOption, 
    selectedList: IngredientOption[], 
    setSelectedList: React.Dispatch<React.SetStateAction<IngredientOption[]>>,
    categoryName: string
  ) => {
    const isAlreadySelected = selectedList.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      // Remove if already selected
      setSelectedList(selectedList.filter(item => item.id !== option.id));
    } else {
      // Add if not selected and less than 5 items are selected
      if (selectedList.length < 5) {
        setSelectedList([...selectedList, option]);
      } else {
        toast({
          title: `Maximum 5 ${categoryName}`,
          description: `Vous avez atteint le maximum de 5 ${categoryName}. Veuillez en retirer un pour ajouter un nouveau.`,
          variant: "destructive",
        });
      }
    }
  };

  // Calculate extra costs
  const calculateExtraCost = () => {
    let extraCost = 0;

    // Add extra cost for any non-included items
    [...selectedIngredients, ...selectedProteins, ...selectedSauces].forEach(item => {
      if (!item.included) {
        extraCost += item.price;
      }
    });

    return extraCost;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return basePrice + calculateExtraCost();
  };

  // Navigate to next step or complete order
  const handleNext = () => {
    if (step < 3) {
      // Validation for each step
      if (step === 1 && selectedIngredients.length === 0) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner au moins un ingrédient",
          variant: "destructive",
        });
        return;
      }
      
      if (step === 2 && selectedProteins.length === 0) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner au moins une protéine",
          variant: "destructive",
        });
        return;
      }

      setStep(step + 1);
    } else {
      // Step 3 (sauce) - add to cart and complete
      if (selectedSauces.length === 0) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner au moins une sauce",
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
      };
      
      // Add to cart
      cart.addItem(customPokeItem, 1);
      
      toast({
        title: "Personnalisation réussie !",
        description: "Votre poké bowl personnalisé a été ajouté au panier",
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
      case 1:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">1 : Ingrédients (5 choix maximum)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ingredientOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`ingredient-${option.id}`} 
                    checked={selectedIngredients.some(item => item.id === option.id)}
                    onCheckedChange={() => handleSelectionToggle(option, selectedIngredients, setSelectedIngredients, "ingrédients")}
                    disabled={selectedIngredients.length >= 5 && !selectedIngredients.some(item => item.id === option.id)}
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
            {selectedIngredients.length === 5 && (
              <p className="text-sm text-gold-600 mt-2">
                Vous avez sélectionné le maximum de 5 ingrédients.
              </p>
            )}
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">2 : Protéines (5 choix maximum)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {proteinOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`protein-${option.id}`} 
                    checked={selectedProteins.some(item => item.id === option.id)}
                    onCheckedChange={() => handleSelectionToggle(option, selectedProteins, setSelectedProteins, "protéines")}
                    disabled={selectedProteins.length >= 5 && !selectedProteins.some(item => item.id === option.id)}
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
            {selectedProteins.length === 5 && (
              <p className="text-sm text-gold-600 mt-2">
                Vous avez sélectionné le maximum de 5 protéines.
              </p>
            )}
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">3 : Sauces (5 choix maximum)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sauceOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`sauce-${option.id}`} 
                    checked={selectedSauces.some(item => item.id === option.id)}
                    onCheckedChange={() => handleSelectionToggle(option, selectedSauces, setSelectedSauces, "sauces")}
                    disabled={selectedSauces.length >= 5 && !selectedSauces.some(item => item.id === option.id)}
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
            {selectedSauces.length === 5 && (
              <p className="text-sm text-gold-600 mt-2">
                Vous avez sélectionné le maximum de 5 sauces.
              </p>
            )}
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
        <p className="text-gray-600 mb-6">Composez votre Poké bowl sur mesure selon vos envies ! (5 choix maximum par catégorie)</p>

        <div className="flex mb-6 overflow-x-auto">
          {[1, 2, 3].map((stepNumber) => (
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
                stepNumber
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Étape {step}/3
              </h2>
              <div className="text-right">
                <p className="text-sm">Total:</p>
                <p className="text-xl font-bold text-gold-600">
                  {calculateTotalPrice().toFixed(2)}€
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
            
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => step > 1 ? setStep(step - 1) : navigate("/commander")}
              >
                {step > 1 ? "Précédent" : "Annuler"}
              </Button>
              <Button onClick={handleNext}>
                {step < 3 ? "Continuer" : "Ajouter au panier"}
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
