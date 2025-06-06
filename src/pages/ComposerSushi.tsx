import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface ComposerSushiState {
  baseItem: MenuItem;
}

interface SushiOption {
  id: string;
  name: string;
  price: number;
  included: boolean;
  category: string;
  isSelected?: boolean;
}

interface BoxOption {
  id: string;
  pieces: number;
  creations: number;
  price: number;
  name: string;
  description?: string;
}

interface SushiCreation {
  enrobage: SushiOption | null;
  base: SushiOption | null;
  garnitures: SushiOption[];
  topping: SushiOption | null;
  sauce: SushiOption | null;
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

  // States for ingredients from database
  const [enrobageOptions, setEnrobageOptions] = useState<SushiOption[]>([]);
  const [baseOptions, setBaseOptions] = useState<SushiOption[]>([]);
  const [garnituresOptions, setGarnituresOptions] = useState<SushiOption[]>([]);
  const [toppingOptions, setToppingOptions] = useState<SushiOption[]>([]);
  const [sauceOptions, setSauceOptions] = useState<SushiOption[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch ingredients from database
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        console.log("Fetching sushi ingredients from database...");
        
        const { data: ingredients, error } = await supabase
          .from('sushi_ingredients')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching sushi ingredients:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les ingrédients",
            variant: "destructive",
          });
          return;
        }

        console.log("Sushi ingredients fetched:", ingredients);

        // Transform ingredients to SushiOption format and group by type
        const transformedIngredients = ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          price: ingredient.price,
          included: ingredient.included,
          category: ingredient.ingredient_type
        }));

        // Group ingredients by type
        setEnrobageOptions(transformedIngredients.filter(ing => ing.category === 'enrobage'));
        setBaseOptions(transformedIngredients.filter(ing => ing.category === 'protein'));
        setGarnituresOptions(transformedIngredients.filter(ing => ing.category === 'ingredient'));
        setToppingOptions(transformedIngredients.filter(ing => ing.category === 'topping'));
        setSauceOptions(transformedIngredients.filter(ing => ing.category === 'sauce'));

      } catch (error) {
        console.error('Error in fetchIngredients:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des ingrédients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [toast]);

  // Handle garniture selection (max 2 included)
  const handleGarnitureSelect = (option: SushiOption) => {
    const isAlreadySelected = selectedGarnitures.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      setSelectedGarnitures(selectedGarnitures.filter(item => item.id !== option.id));
    } else {
      setSelectedGarnitures([...selectedGarnitures, option]);
    }
  };

  // Calculate extra costs for current creation
  const calculateCreationExtraCost = () => {
    let extraCost = 0;

    // Extra cost for enrobage
    if (selectedEnrobage && !selectedEnrobage.included) {
      extraCost += selectedEnrobage.price;
    }

    // Extra cost for garnitures (first 2 included)
    if (selectedGarnitures.length > 2) {
      extraCost += (selectedGarnitures.length - 2) * 1; // +1€ per extra garniture
    }

    return extraCost;
  };

  // Calculate total extra cost for all creations
  const calculateTotalExtraCost = () => {
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
    totalExtraCost += calculateCreationExtraCost();
    
    return totalExtraCost;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedBox) return 0;
    return selectedBox.price + calculateTotalExtraCost();
  };

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
        // All creations completed - add to cart
        const customSushiItem: MenuItem = {
          id: `custom-sushi-${Date.now()}`,
          name: `Sushi Créa ${selectedBox?.pieces} pièces`,
          description: updatedCompletedCreations.map((creation, index) => 
            `Création ${index + 1}: Enrobage: ${creation.enrobage?.name}, Base: ${creation.base?.name}, Garnitures: ${creation.garnitures.map(g => g.name).join(', ')}, ${creation.topping ? `Topping: ${creation.topping.name}, ` : ''}Sauce: ${creation.sauce?.name}`
          ).join(' | '),
          price: calculateTotalPrice(),
          category: "custom",
        };
        
        // Add to cart
        cart.addItem(customSushiItem, 1);
        
        toast({
          title: "Personnalisation réussie !",
          description: "Vos sushis personnalisés ont été ajoutés au panier",
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
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis ta box</h3>
            <p className="text-sm text-gray-600 mb-4">
              1 création = 6 pièces personnalisées<br/>
              Formule: 3 créations achetées = 1 création offerte
            </p>
            <RadioGroup value={selectedBox?.id || ""} onValueChange={(value) => {
              const box = boxOptions.find(box => box.id === value);
              setSelectedBox(box || null);
              // Reset all creations when changing box
              setCompletedCreations([]);
              setCurrentCreationIndex(0);
              resetCurrentCreation();
            }}>
              {boxOptions.map((box) => (
                <div key={box.id} className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value={box.id} id={box.id} />
                  <Label htmlFor={box.id} className="flex-1">
                    <div className="flex justify-between">
                      <span>{box.name} ({box.description})</span>
                      <span className="font-semibold">{box.price}€</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-gray-500 mt-4">
              Tout supplément au-delà des choix inclus: +1€
            </p>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis ton enrobage extérieur</h3>
            
            <h4 className="font-semibold mb-2">Enrobage classique (inclus) :</h4>
            <RadioGroup value={selectedEnrobage?.id || ""} onValueChange={(value) => {
              const option = enrobageOptions.find(opt => opt.id === value);
              setSelectedEnrobage(option || null);
            }}>
              {enrobageOptions.filter(opt => opt.included).map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
                  <Label htmlFor={`enrobage-${option.id}`}>{option.name}</Label>
                </div>
              ))}
            
              <h4 className="font-semibold mt-4 mb-2">Enrobage premium (+1€) :</h4>
              {enrobageOptions.filter(opt => !opt.included).map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
                  <Label htmlFor={`enrobage-${option.id}`}>
                    <div className="flex justify-between">
                      <span>{option.name}</span>
                      <span className="font-semibold">+{option.price}€</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis ta base (1 choix inclus)</h3>
            <RadioGroup value={selectedBase?.id || ""} onValueChange={(value) => {
              const option = baseOptions.find(opt => opt.id === value);
              setSelectedBase(option || null);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {baseOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={option.id} id={`base-${option.id}`} />
                    <Label htmlFor={`base-${option.id}`}>{option.name}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis tes garnitures (2 choix inclus)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Les 2 premiers choix sont inclus, chaque garniture supplémentaire: +1€
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {garnituresOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`garniture-${option.id}`} 
                    checked={selectedGarnitures.some(item => item.id === option.id)}
                    onCheckedChange={() => handleGarnitureSelect(option)}
                  />
                  <Label htmlFor={`garniture-${option.id}`}>{option.name}</Label>
                </div>
              ))}
            </div>
            {selectedGarnitures.length > 2 && (
              <p className="text-sm text-gold-600 mt-2">
                +{selectedGarnitures.length - 2}€ pour {selectedGarnitures.length - 2} garniture(s) supplémentaire(s)
              </p>
            )}
          </div>
        );
      
      case 5:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis ton topping (1 choix inclus)</h3>
            {selectedEnrobage?.name.toLowerCase().includes("nori") && (
              <p className="text-sm text-red-500 mb-4">
                Toppings non disponibles avec l'enrobage "Maki"
              </p>
            )}
            <RadioGroup 
              value={selectedTopping?.id || ""}
              onValueChange={(value) => {
                if (!selectedEnrobage?.name.toLowerCase().includes("nori")) {
                  const option = toppingOptions.find(opt => opt.id === value);
                  setSelectedTopping(option || null);
                }
              }}
              disabled={selectedEnrobage?.name.toLowerCase().includes("nori")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {toppingOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem 
                      value={option.id} 
                      id={`topping-${option.id}`} 
                      disabled={selectedEnrobage?.name.toLowerCase().includes("nori")}
                    />
                    <Label 
                      htmlFor={`topping-${option.id}`}
                      className={selectedEnrobage?.name.toLowerCase().includes("nori") ? "text-gray-400" : ""}
                    >
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );
      
      case 6:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis ta sauce (1 choix inclus)</h3>
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
                    {calculateTotalPrice().toFixed(2)}€
                  </p>
                  {calculateTotalExtraCost() > 0 && (
                    <p className="text-xs text-gray-500">
                      (+{calculateTotalExtraCost().toFixed(2)}€ suppléments)
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
        
        {/* Show completed creations summary */}
        {completedCreations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Créations terminées ({completedCreations.length}/{selectedBox?.creations})</h3>
            <div className="space-y-4">
              {completedCreations.map((creation, index) => (
                <Card key={index}>
                  <CardContent className="mt-4">
                    <h4 className="font-semibold mb-2">Création {index + 1}</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Enrobage:</span> {creation.enrobage?.name}</div>
                      <div><span className="font-medium">Base:</span> {creation.base?.name}</div>
                      <div><span className="font-medium">Garnitures:</span> {creation.garnitures.map(g => g.name).join(', ')}</div>
                      {creation.topping && <div><span className="font-medium">Topping:</span> {creation.topping.name}</div>}
                      <div><span className="font-medium">Sauce:</span> {creation.sauce?.name}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {step === 6 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Récapitulatif de la création actuelle</h3>
            <Card>
              <CardContent className="mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Enrobage:</span>
                    <span>{selectedEnrobage?.name} {!selectedEnrobage?.included && `(+${selectedEnrobage?.price}€)`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Base:</span>
                    <span>{selectedBase?.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">Garnitures:</span>
                    <span className="text-right">
                      {selectedGarnitures.map(g => g.name).join(', ')}
                      {selectedGarnitures.length > 2 && (
                        <span className="block text-sm text-gold-600">
                          (+{selectedGarnitures.length - 2}€ supplément)
                        </span>
                      )}
                    </span>
                  </div>
                  {(selectedTopping && !selectedEnrobage?.name.toLowerCase().includes("nori")) && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Topping:</span>
                      <span>{selectedTopping.name}</span>
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
                    <span>Total final:</span>
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

export default ComposerSushi;
