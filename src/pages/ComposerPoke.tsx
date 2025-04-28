
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";
import { ArrowLeft, Check } from "lucide-react";

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

  // If no base item is passed, redirect to the main page
  if (!baseItem) {
    navigate("/commander");
  }

  const [step, setStep] = useState<number>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientOption[]>([]);
  const [selectedProtein, setSelectedProtein] = useState<IngredientOption | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<IngredientOption | null>(null);

  // Base price
  const basePrice = 15.9;

  // Ingredient options
  const ingredientOptions: IngredientOption[] = [
    { id: "carotte", name: "Carotte", price: 0, included: true },
    { id: "radis", name: "Radis", price: 0, included: true },
    { id: "concombre", name: "Concombre", price: 0, included: true },
    { id: "edamame", name: "Edamame", price: 0, included: true },
    { id: "avocat", name: "Avocat", price: 0, included: true },
    { id: "mais", name: "Maïs", price: 0, included: true },
    { id: "chou-rouge", name: "Chou rouge", price: 0, included: true },
    { id: "wakame", name: "Algues wakame", price: 0, included: true },
    { id: "mangue", name: "Mangue", price: 0, included: true },
    { id: "ananas", name: "Ananas", price: 0, included: true },
    { id: "oignons-frits", name: "Oignons frits", price: 0, included: true },
    { id: "cream-cheese", name: "Cream cheese", price: 0, included: true },
    { id: "chevre", name: "Chèvre", price: 0, included: true },
  ];

  // Protein options
  const proteinOptions: IngredientOption[] = [
    { id: "saumon", name: "Saumon", price: 0, included: true },
    { id: "saumon-tataki", name: "Saumon tataki", price: 0, included: true },
    { id: "thon", name: "Thon", price: 0, included: true },
    { id: "thon-tataki", name: "Thon tataki", price: 0, included: true },
    { id: "thon-cuit", name: "Thon cuit", price: 0, included: true },
    { id: "crevette-tempura", name: "Crevette tempura", price: 0, included: true },
    { id: "poulet-tempura", name: "Poulet tempura", price: 0, included: true },
    { id: "tofu", name: "Tofu", price: 0, included: true },
  ];

  // Sauce options
  const sauceOptions: IngredientOption[] = [
    { id: "soja-sucre", name: "Soja sucré", price: 0, included: true },
    { id: "soja-salee", name: "Soja salée", price: 0, included: true },
    { id: "mayonnaise-spicy", name: "Mayonnaise spicy", price: 0, included: true },
    { id: "mayonnaise", name: "Mayonnaise", price: 0, included: true },
    { id: "teriyaki", name: "Teriyaki", price: 0, included: true },
  ];

  // Handle ingredient selection (max 5 included)
  const handleIngredientSelect = (option: IngredientOption) => {
    // Check if this option is already selected
    const isAlreadySelected = selectedIngredients.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      // If selected, remove it
      setSelectedIngredients(selectedIngredients.filter(item => item.id !== option.id));
    } else {
      // If not selected and less than 5 ingredients are selected, add it
      if (selectedIngredients.length < 5) {
        setSelectedIngredients([...selectedIngredients, option]);
      } else {
        toast({
          title: "Maximum 5 ingrédients",
          description: "Vous avez atteint le maximum de 5 ingrédients. Veuillez en retirer un pour ajouter un nouveau.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate extra costs
  const calculateExtraCost = () => {
    let extraCost = 0;

    // Extra cost for ingredients beyond 5
    if (selectedIngredients.length > 5) {
      extraCost += (selectedIngredients.length - 5) * 1; // +1€ per extra ingredient
    }

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
      
      if (step === 2 && !selectedProtein) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une protéine",
          variant: "destructive",
        });
        return;
      }

      setStep(step + 1);
    } else {
      // Step 3 (sauce) - add to cart and complete
      if (!selectedSauce) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une sauce",
          variant: "destructive",
        });
        return;
      }
      
      // Create custom poke bowl item
      const customPokeItem: MenuItem = {
        id: `custom-poke-${Date.now()}`,
        name: `Poké Créa`,
        description: `Ingrédients: ${selectedIngredients.map(g => g.name).join(', ')}, Protéine: ${selectedProtein?.name}, Sauce: ${selectedSauce.name}`,
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
                    onCheckedChange={() => handleIngredientSelect(option)}
                    disabled={selectedIngredients.length >= 5 && !selectedIngredients.some(item => item.id === option.id)}
                  />
                  <Label htmlFor={`ingredient-${option.id}`}>{option.name}</Label>
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
            <h3 className="text-xl font-bold mb-4">2 : Protéine (1 choix)</h3>
            <RadioGroup value={selectedProtein?.id || ""} onValueChange={(value) => {
              const option = proteinOptions.find(opt => opt.id === value);
              setSelectedProtein(option || null);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {proteinOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={option.id} id={`protein-${option.id}`} />
                    <Label htmlFor={`protein-${option.id}`}>{option.name}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">3 : Sauce</h3>
            <RadioGroup value={selectedSauce?.id || ""} onValueChange={(value) => {
              const option = sauceOptions.find(opt => opt.id === value);
              setSelectedSauce(option || null);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sauceOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={option.id} id={`sauce-${option.id}`} />
                    <Label htmlFor={`sauce-${option.id}`}>{option.name}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
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
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au menu
        </Button>

        <h1 className="text-3xl font-bold mb-2">POKÉ CRÉA</h1>
        <p className="text-gray-600 mb-6">Composez votre Poké bowl sur mesure selon vos envies !</p>

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
                onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
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
                  {selectedProtein && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Protéine:</span>
                      <span>{selectedProtein.name}</span>
                    </div>
                  )}
                  {selectedSauce && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Sauce:</span>
                      <span>{selectedSauce.name}</span>
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
