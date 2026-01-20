import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";
import { Restaurant } from "@/types/restaurant";
import { ArrowLeft, Check } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

// Import types and utilities
import { SushiOption, BoxOption, SushiCreation } from "@/types/sushi-creator";
import { calculateCreationExtraCost, calculateTotalExtraCost, calculateTotalPrice } from "@/utils/sushi-calculator";

// Import components
import { RestaurantSelector } from "@/components/creation/RestaurantSelector";
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
  const { currentRestaurant } = useRestaurantContext();

  const { baseItem } = (location.state as ComposerSushiState) || { baseItem: null };

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
  const [selectedBox, setSelectedBox] = useState<BoxOption | null>(null);
  
  // Current creation being built
  const [currentCreationIndex, setCurrentCreationIndex] = useState<number>(0);
  const [selectedEnrobage, setSelectedEnrobage] = useState<SushiOption | null>(null);
  const [selectedBases, setSelectedBases] = useState<SushiOption[]>([]);
  const [selectedGarnitures, setSelectedGarnitures] = useState<SushiOption[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<SushiOption[]>([]);
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
    setSelectedBases([]);
    setSelectedGarnitures([]);
    setSelectedToppings([]);
    setSelectedSauce(null);
  };

  // Handle base selection (multiple, 1 included, +0.50€ for 2nd, max 2)
  const handleBaseSelect = (option: SushiOption) => {
    const isAlreadySelected = selectedBases.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      setSelectedBases(selectedBases.filter(item => item.id !== option.id));
    } else if (selectedBases.length < 2) {
      setSelectedBases([...selectedBases, option]);
    }
  };

  // Handle topping selection (multiple, 1 included, +0.50€ per extra)
  const handleToppingSelect = (option: SushiOption) => {
    const isAlreadySelected = selectedToppings.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      setSelectedToppings(selectedToppings.filter(item => item.id !== option.id));
    } else {
      setSelectedToppings([...selectedToppings, option]);
    }
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
  const totalExtraCost = calculateTotalExtraCost(completedCreations, selectedEnrobage, selectedBases, selectedGarnitures, selectedToppings);
  const totalPrice = calculateTotalPrice(selectedBox, totalExtraCost);

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
    
    if (step === 3 && selectedBases.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une base",
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
    
    // For topping, check if enrobage is not nori, otherwise clear toppings
    if (step === 5 && selectedEnrobage?.name.toLowerCase().includes("nori") && selectedToppings.length > 0) {
      toast({
        title: "Information",
        description: "Les toppings ne sont pas disponibles avec l'enrobage feuille d'algue nori",
      });
      setSelectedToppings([]);
    }

    // Step 6 (sauce) - complete current creation
    if (step === 6) {
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
        bases: [...selectedBases],
        garnitures: [...selectedGarnitures],
        toppings: [...selectedToppings],
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
          const creationExtraCost = calculateCreationExtraCost(creation.enrobage, creation.bases, creation.garnitures, creation.toppings);
          const basePrice = (selectedBox?.price || 0) / (selectedBox?.creations || 1);
          const finalPrice = basePrice + creationExtraCost;
          
          // Generate unique ID with timestamp and random component
          const uniqueId = `custom-sushi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
          
          const customSushiItem: MenuItem = {
            id: uniqueId,
            name: `Sushi Créa ${uniqueId.substr(-5)} - Création ${index + 1}`,
            description: `Enrobage: ${creation.enrobage?.name} | Base: ${creation.bases.map(b => b.name).join(', ')} | Garnitures: ${creation.garnitures.map(g => g.name).join(', ')}${creation.toppings.length > 0 ? ` | Toppings: ${creation.toppings.map(t => t.name).join(', ')}` : ''} | Sauce: ${creation.sauce?.name}`,
            price: finalPrice,
            category: "custom",
            pieces: 6,
            restaurant_id: selectedRestaurant?.id
          };
          
          // Add each creation to cart with restaurant
          cart.addItemWithRestaurant(customSushiItem, 1, selectedRestaurant!.id);
        });
        
        toast({
          title: "Personnalisation réussie !",
          description: `${updatedCompletedCreations.length} créations de sushi ajoutées au panier pour ${selectedRestaurant?.name}`,
        });
        
        // Navigate back to menu
        navigate("/commander");
      }
      return;
    }

    // Continue to next step
    setStep(step + 1);
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasInitialRestaurant && step === 1) {
      navigate("/commander");
    } else if (step > 0) {
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
      case 0:
        return <RestaurantSelector selectedRestaurant={selectedRestaurant} onSelectRestaurant={setSelectedRestaurant} />;
      case 1:
        return <BoxSelection selectedBox={selectedBox} boxOptions={boxOptions} onBoxSelect={handleBoxSelect} />;
      case 2:
        return <EnrobageSelection selectedEnrobage={selectedEnrobage} enrobageOptions={enrobageOptions} onEnrobageSelect={setSelectedEnrobage} />;
      case 3:
        return <BaseSelection selectedBases={selectedBases} baseOptions={baseOptions} onBaseSelect={handleBaseSelect} />;
      case 4:
        return <GarnituresSelection selectedGarnitures={selectedGarnitures} garnituresOptions={garnituresOptions} onGarnitureSelect={handleGarnitureSelect} />;
      case 5:
        return <ToppingSelection selectedToppings={selectedToppings} toppingOptions={toppingOptions} selectedEnrobage={selectedEnrobage} onToppingSelect={handleToppingSelect} />;
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

        {/* Show selected restaurant */}
        {selectedRestaurant && step > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">Restaurant sélectionné :</span> {selectedRestaurant.name}
            </p>
          </div>
        )}

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
          {(hasInitialRestaurant ? [1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6]).map((stepNumber, index) => (
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
                {step === 0 ? "Restaurant" : `Étape ${step}/${hasInitialRestaurant ? 6 : 6}`}
              </h2>
              {selectedBox && step > 0 && (
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
                {(hasInitialRestaurant && step === 1) || step === 0 ? "Annuler" : "Précédent"}
              </Button>
              <Button onClick={handleNext}>
                {step === 0 
                  ? "Continuer"
                  : step < 6 
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
            selectedBases={selectedBases}
            selectedGarnitures={selectedGarnitures}
            selectedToppings={selectedToppings}
            selectedSauce={selectedSauce}
            totalPrice={totalPrice}
          />
        )}
      </motion.div>
    </div>
  );
};

export default ComposerSushi;
