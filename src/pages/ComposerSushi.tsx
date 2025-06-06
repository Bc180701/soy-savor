import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";
import { ArrowLeft, Check } from "lucide-react";

// Import types and utilities
import { SushiOption, BoxOption, SushiCreation } from "@/types/sushi-creator";
import { calculateCreationExtraCost, calculateTotalExtraCost, calculateTotalPrice } from "@/utils/sushi-calculator";

// Import components
import { BoxSelection } from "@/components/sushi-creator/BoxSelection";
import { EnrobageSelection } from "@/components/sushi-creator/EnrobageSelection";
import { BaseSelection } from "@/components/sushi-creator/BaseSelection";
import { GarnituresSelection } from "@/components/sushi-creator/GarnituresSelection";
import { ToppingSelection } from "@/components/sushi-creator/ToppingSelection";
import { SauceSelection } from "@/components/sushi-creator/SauceSelection";
import { CreationSummary } from "@/components/sushi-creator/CreationSummary";
import { CompletedCreations } from "@/components/sushi-creator/CompletedCreations";

// Import hook
import { useSushiIngredients } from "@/hooks/useSushiIngredients";

interface ComposerSushiState {
  baseItem: MenuItem;
}

const ComposerSushi = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCart();

  const { baseItem } = (location.state as ComposerSushiState) || { baseItem: null };

  const [step, setStep] = useState<number>(1);
  const [selectedBox, setSelectedBox] = useState<BoxOption | null>(null);
  
  // Current creation being built
  const [currentCreationIndex, setCurrentCreationIndex] = useState<number>(0);
  const [selectedEnrobage, setSelectedEnrobage] = useState<SushiOption | null>(null);
  const [selectedBase, setSelectedBase] = useState<SushiOption | null>(null);
  const [selectedGarnitures, setSelectedGarnitures] = useState<SushiOption[]>([]);
  const [selectedTopping, setSelectedTopping] = useState<SushiOption | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<SushiOption | null>(null);
  
  // Store all completed creations
  const [completedCreations, setCompletedCreations] = useState<SushiCreation[]>([]);

  // Get ingredients from hook
  const {
    enrobageOptions,
    baseOptions,
    garnituresOptions,
    toppingOptions,
    sauceOptions,
    loading
  } = useSushiIngredients();

  // Box options
  const boxOptions: BoxOption[] = [
    { 
      id: "box-6", 
      name: "6 pièces", 
      pieces: 6, 
      creations: 1, 
      price: 8.5,
      description: "1 création"
    },
    { 
      id: "box-12", 
      name: "12 pièces", 
      pieces: 12, 
      creations: 2, 
      price: 17,
      description: "2 créations"
    },
    { 
      id: "box-18", 
      name: "18 pièces", 
      pieces: 18, 
      creations: 3, 
      price: 25,
      description: "3 créations"
    },
    { 
      id: "box-24", 
      name: "24 pièces", 
      pieces: 24, 
      creations: 4, 
      price: 25,
      description: "4 créations (La 4e création est OFFERTE !)"
    },
  ];

  // Reset current creation when starting a new one
  const resetCurrentCreation = () => {
    setSelectedEnrobage(null);
    setSelectedBase(null);
    setSelectedGarnitures([]);
    setSelectedTopping(null);
    setSelectedSauce(null);
  };

  // Handle garniture selection (max 2 included)
  const handleGarnitureSelect = (option: SushiOption) => {
    const isAlreadySelected = selectedGarnitures.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      setSelectedGarnitures(selectedGarnitures.filter(item => item.id !== option.id));
    } else {
      setSelectedGarnitures([...selectedGarnitures, option]);
    }
  };

  // Handle box selection
  const handleBoxSelect = (box: BoxOption | null) => {
    setSelectedBox(box);
    // Reset all creations when changing box
    setCompletedCreations([]);
    setCurrentCreationIndex(0);
    resetCurrentCreation();
  };

  // Calculate total extra cost for all creations
  const totalExtraCost = calculateTotalExtraCost(completedCreations, selectedEnrobage, selectedGarnitures);
  const totalPrice = calculateTotalPrice(selectedBox, totalExtraCost);

  // Navigate to next step or complete order
  const handleNext = () => {
    if (step < 6) {
      // Validation for each step
      if (step === 1 && !selectedBox) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une box",
          variant: "destructive",
        });
        return;
      }
      
      if (step === 2 && !selectedEnrobage) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner un enrobage",
          variant: "destructive",
        });
        return;
      }
      
      if (step === 3 && !selectedBase) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une base",
          variant: "destructive",
        });
        return;
      }
      
      if (step === 4 && selectedGarnitures.length === 0) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner au moins une garniture",
          variant: "destructive",
        });
        return;
      }
      
      // For topping, check if enrobage is not nori, otherwise topping is optional
      if (step === 5 && selectedEnrobage?.name.toLowerCase().includes("nori") && selectedTopping) {
        toast({
          title: "Information",
          description: "Les toppings ne sont pas disponibles avec l'enrobage feuille d'algue nori",
        });
        setSelectedTopping(null);
      }

      setStep(step + 1);
    } else {
      // Step 6 (sauce) - complete current creation
      if (!selectedSauce) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une sauce",
          variant: "destructive",
        });
        return;
      }
      
      // Save current creation
      const currentCreation: SushiCreation = {
        enrobage: selectedEnrobage,
        base: selectedBase,
        garnitures: [...selectedGarnitures],
        topping: selectedTopping,
        sauce: selectedSauce
      };
      
      const updatedCompletedCreations = [...completedCreations, currentCreation];
      setCompletedCreations(updatedCompletedCreations);
      
      // Check if we need more creations
      if (updatedCompletedCreations.length < (selectedBox?.creations || 0)) {
        // More creations needed - reset and go back to step 2
        setCurrentCreationIndex(updatedCompletedCreations.length);
        resetCurrentCreation();
        setStep(2);
        
        toast({
          title: "Création terminée !",
          description: `Création ${updatedCompletedCreations.length}/${selectedBox?.creations} terminée. Passez à la création suivante.`,
        });
      } else {
        // All creations completed - add each creation as separate item to cart
        updatedCompletedCreations.forEach((creation, index) => {
          const creationExtraCost = calculateCreationExtraCost(creation.enrobage, creation.garnitures);
          const basePrice = (selectedBox?.price || 0) / (selectedBox?.creations || 1);
          const finalPrice = basePrice + creationExtraCost;
          
          const customSushiItem: MenuItem = {
            id: `custom-sushi-creation-${Date.now()}-${index}`,
            name: `Sushi Créa - Création ${index + 1}`,
            description: `Enrobage: ${creation.enrobage?.name} | Base: ${creation.base?.name} | Garnitures: ${creation.garnitures.map(g => g.name).join(', ')}${creation.topping ? ` | Topping: ${creation.topping.name}` : ''} | Sauce: ${creation.sauce?.name}`,
            price: finalPrice,
            category: "custom",
            pieces: 6
          };
          
          // Add each creation to cart separately
          cart.addItem(customSushiItem, 1);
        });
        
        toast({
          title: "Personnalisation réussie !",
          description: `${updatedCompletedCreations.length} créations de sushi ajoutées au panier`,
        });
        
        // Navigate back to menu
        navigate("/commander");
      }
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/commander");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          <span className="ml-2">Chargement des ingrédients...</span>
        </div>
      </div>
    );
  }

  // Get current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <BoxSelection selectedBox={selectedBox} boxOptions={boxOptions} onBoxSelect={handleBoxSelect} />;
      case 2:
        return <EnrobageSelection selectedEnrobage={selectedEnrobage} enrobageOptions={enrobageOptions} onEnrobageSelect={setSelectedEnrobage} />;
      case 3:
        return <BaseSelection selectedBase={selectedBase} baseOptions={baseOptions} onBaseSelect={setSelectedBase} />;
      case 4:
        return <GarnituresSelection selectedGarnitures={selectedGarnitures} garnituresOptions={garnituresOptions} onGarnitureSelect={handleGarnitureSelect} />;
      case 5:
        return <ToppingSelection selectedTopping={selectedTopping} toppingOptions={toppingOptions} selectedEnrobage={selectedEnrobage} onToppingSelect={setSelectedTopping} />;
      case 6:
        return <SauceSelection selectedSauce={selectedSauce} sauceOptions={sauceOptions} onSauceSelect={setSelectedSauce} />;
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

        <h1 className="text-3xl font-bold mb-2">SUSHI CRÉA</h1>
        <p className="text-gray-600 mb-6">Compose tes propres sushis !</p>

        {/* Show progress for multiple creations */}
        {selectedBox && selectedBox.creations > 1 && step > 1 && (
          <div className="mb-4 p-4 bg-gold-50 border border-gold-200 rounded-lg">
            <p className="text-center font-semibold text-gold-800">
              Création {currentCreationIndex + 1} sur {selectedBox.creations}
            </p>
            <p className="text-center text-sm text-gold-600">
              Créations terminées: {completedCreations.length}/{selectedBox.creations}
            </p>
          </div>
        )}

        <div className="flex mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
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
                Étape {step}/6
              </h2>
              {selectedBox && (
                <div className="text-right">
                  <p className="text-sm">Total estimé:</p>
                  <p className="text-xl font-bold text-gold-600">
                    {totalPrice.toFixed(2)}€
                  </p>
                  {totalExtraCost > 0 && (
                    <p className="text-xs text-gray-500">
                      (+{totalExtraCost.toFixed(2)}€ suppléments)
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
            
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleBack}
              >
                {step > 1 ? "Précédent" : "Annuler"}
              </Button>
              <Button onClick={handleNext}>
                {step < 6 
                  ? "Continuer" 
                  : completedCreations.length + 1 < (selectedBox?.creations || 0)
                  ? "Création suivante"
                  : "Ajouter au panier"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <CompletedCreations completedCreations={completedCreations} selectedBox={selectedBox} />
        
        {step === 6 && (
          <CreationSummary
            selectedEnrobage={selectedEnrobage}
            selectedBase={selectedBase}
            selectedGarnitures={selectedGarnitures}
            selectedTopping={selectedTopping}
            selectedSauce={selectedSauce}
            totalPrice={totalPrice}
          />
        )}
      </motion.div>
    </div>
  );
};

export default ComposerSushi;
