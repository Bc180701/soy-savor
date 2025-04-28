
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
}

const ComposerSushi = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCart();

  const { baseItem } = (location.state as ComposerSushiState) || { baseItem: null };

  // If no base item is passed, redirect to the main page
  if (!baseItem) {
    navigate("/commander");
  }

  const [step, setStep] = useState<number>(1);
  const [selectedBox, setSelectedBox] = useState<BoxOption | null>(null);
  const [selectedEnrobage, setSelectedEnrobage] = useState<SushiOption | null>(null);
  const [selectedBase, setSelectedBase] = useState<SushiOption | null>(null);
  const [selectedGarnitures, setSelectedGarnitures] = useState<SushiOption[]>([]);
  const [selectedTopping, setSelectedTopping] = useState<SushiOption | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<SushiOption | null>(null);

  // Box options
  const boxOptions: BoxOption[] = [
    { id: "box-12", name: "Box 12 pièces", pieces: 12, creations: 2, price: 15 },
    { id: "box-18", name: "Box 18 pièces", pieces: 18, creations: 3, price: 22 },
    { id: "box-24", name: "Box 24 pièces", pieces: 24, creations: 4, price: 25 },
  ];

  // Enrobage options
  const enrobageOptions: SushiOption[] = [
    { id: "nori", name: "Feuille d'algue nori (Maki)", price: 0, included: true, category: "classique" },
    { id: "tapioca", name: "Feuille de tapioca salade (Spring)", price: 0, included: true, category: "classique" },
    { id: "riz", name: "Riz (California)", price: 0, included: true, category: "classique" },
    { id: "salmon", name: "Salmon (tranche de saumon)", price: 1, included: false, category: "premium" },
    { id: "salmon-tataki", name: "Salmon tataki (tranche de saumon snacke)", price: 1, included: false, category: "premium" },
    { id: "avocado", name: "Avocado (tranche d'avocat)", price: 1, included: false, category: "premium" },
    { id: "mango", name: "Mango (tranche de mangue)", price: 1, included: false, category: "premium" },
    { id: "cheddar", name: "Cheddar (tranche de cheddar snacke)", price: 1, included: false, category: "premium" },
  ];

  // Base options
  const baseOptions: SushiOption[] = [
    { id: "saumon", name: "Saumon", price: 0, included: true, category: "base" },
    { id: "thon", name: "Thon", price: 0, included: true, category: "base" },
    { id: "thon-cuit", name: "Thon cuit", price: 0, included: true, category: "base" },
    { id: "daurade", name: "Daurade", price: 0, included: true, category: "base" },
    { id: "crevette", name: "Crevette", price: 0, included: true, category: "base" },
    { id: "crevette-tempura", name: "Crevette tempura", price: 0, included: true, category: "base" },
    { id: "crabe", name: "Chair de crabe", price: 0, included: true, category: "base" },
    { id: "poulet", name: "Poulet tempura", price: 0, included: true, category: "base" },
    { id: "chevre", name: "Chèvre", price: 0, included: true, category: "base" },
    { id: "foie-gras", name: "Foie gras", price: 0, included: true, category: "base" },
    { id: "brie", name: "Brie truffée", price: 0, included: true, category: "base" },
    { id: "tofu", name: "Tofu frit", price: 0, included: true, category: "base" },
  ];

  // Garnitures options
  const garnituresOptions: SushiOption[] = [
    { id: "avocat", name: "Avocat", price: 0, included: true, category: "garniture" },
    { id: "concombre", name: "Concombre", price: 0, included: true, category: "garniture" },
    { id: "chou", name: "Chou rouge", price: 0, included: true, category: "garniture" },
    { id: "mangue", name: "Mangue", price: 0, included: true, category: "garniture" },
    { id: "ananas", name: "Ananas", price: 0, included: true, category: "garniture" },
    { id: "wakame", name: "Algue wakame", price: 0, included: true, category: "garniture" },
    { id: "carotte", name: "Carotte", price: 0, included: true, category: "garniture" },
    { id: "figue", name: "Confiture de figue", price: 0, included: true, category: "garniture" },
    { id: "cream-cheese", name: "Cream cheese", price: 0, included: true, category: "garniture" },
    { id: "menthe", name: "Menthe", price: 0, included: true, category: "garniture" },
    { id: "coriandre", name: "Coriandre", price: 0, included: true, category: "garniture" },
    { id: "ciboulette", name: "Ciboulette", price: 0, included: true, category: "garniture" },
  ];

  // Topping options
  const toppingOptions: SushiOption[] = [
    { id: "sesame", name: "Graines de sésame", price: 0, included: true, category: "topping" },
    { id: "oignons", name: "Oignons frits crispy", price: 0, included: true, category: "topping" },
    { id: "tobiko", name: "Œufs de tobiko", price: 0, included: true, category: "topping" },
    { id: "saumon-oeufs", name: "Œufs de saumon", price: 0, included: true, category: "topping" },
    { id: "noix", name: "Cerneaux de noix", price: 0, included: true, category: "topping" },
    { id: "herbes", name: "Herbes fraiches", price: 0, included: true, category: "topping" },
  ];

  // Sauce options
  const sauceOptions: SushiOption[] = [
    { id: "spicy-mayo", name: "Spicy mayo", price: 0, included: true, category: "sauce" },
    { id: "mayo", name: "Mayo", price: 0, included: true, category: "sauce" },
    { id: "curry", name: "Curry", price: 0, included: true, category: "sauce" },
    { id: "teriyaki", name: "Teriyaki", price: 0, included: true, category: "sauce" },
    { id: "cream-cheese-sauce", name: "Cream cheese", price: 0, included: true, category: "sauce" },
    { id: "miel", name: "Miel", price: 0, included: true, category: "sauce" },
    { id: "wasabi", name: "Wasabi", price: 0, included: true, category: "sauce" },
  ];

  // Handle garniture selection (max 2 included)
  const handleGarnitureSelect = (option: SushiOption) => {
    // Check if this option is already selected
    const isAlreadySelected = selectedGarnitures.some(item => item.id === option.id);
    
    if (isAlreadySelected) {
      // If selected, remove it
      setSelectedGarnitures(selectedGarnitures.filter(item => item.id !== option.id));
    } else {
      // If not selected, add it
      setSelectedGarnitures([...selectedGarnitures, option]);
    }
  };

  // Calculate extra costs
  const calculateExtraCost = () => {
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

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedBox) return 0;
    return selectedBox.price + calculateExtraCost();
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
      if (step === 5 && selectedEnrobage?.id === "nori" && selectedTopping) {
        toast({
          title: "Information",
          description: "Les toppings ne sont pas disponibles avec l'enrobage feuille d'algue nori",
        });
        setSelectedTopping(null);
      }

      setStep(step + 1);
    } else {
      // Step 6 (sauce) - add to cart and complete
      if (!selectedSauce) {
        toast({
          title: "Sélection requise",
          description: "Veuillez sélectionner une sauce",
          variant: "destructive",
        });
        return;
      }
      
      // Create custom sushi item
      const customSushiItem: MenuItem = {
        id: `custom-sushi-${Date.now()}`,
        name: `Sushi Créa ${selectedBox?.pieces} pièces`,
        description: `Enrobage: ${selectedEnrobage?.name}, Base: ${selectedBase?.name}, Garnitures: ${selectedGarnitures.map(g => g.name).join(', ')}, ${selectedTopping ? `Topping: ${selectedTopping.name}, ` : ''}Sauce: ${selectedSauce.name}`,
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
  };

  // Get current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Choisis ta box</h3>
            <RadioGroup value={selectedBox?.id || ""} onValueChange={(value) => {
              const box = boxOptions.find(box => box.id === value);
              setSelectedBox(box || null);
            }}>
              {boxOptions.map((box) => (
                <div key={box.id} className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value={box.id} id={box.id} />
                  <Label htmlFor={box.id} className="flex-1">
                    <div className="flex justify-between">
                      <span>{box.pieces} pièces ({box.creations} créations)</span>
                      <span className="font-semibold">{box.price}€</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">1 - Choisis ton enrobage extérieur</h3>
            
            <h4 className="font-semibold mb-2">Enrobage classique (inclus) :</h4>
            <RadioGroup value={selectedEnrobage?.id || ""} onValueChange={(value) => {
              const option = enrobageOptions.find(opt => opt.id === value);
              setSelectedEnrobage(option || null);
            }}>
              {enrobageOptions.filter(opt => opt.category === "classique").map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
                  <Label htmlFor={`enrobage-${option.id}`}>{option.name}</Label>
                </div>
              ))}
            
              <h4 className="font-semibold mt-4 mb-2">Enrobage premium (+1€) :</h4>
              {enrobageOptions.filter(opt => opt.category === "premium").map((option) => (
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
            <h3 className="text-xl font-bold mb-4">2 - Choisis ta base (1 choix inclus)</h3>
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
            <h3 className="text-xl font-bold mb-4">3 - Choisis tes garnitures (2 choix inclus)</h3>
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
            <h3 className="text-xl font-bold mb-4">4 - Choisis ton topping (1 choix inclus)</h3>
            {selectedEnrobage?.id === "nori" && (
              <p className="text-sm text-red-500 mb-4">
                Les toppings ne sont pas disponibles avec l'enrobage "feuille d'algue nori (maki)"
              </p>
            )}
            <RadioGroup 
              value={selectedTopping?.id || ""}
              onValueChange={(value) => {
                // Only allow topping selection if enrobage is not nori
                if (selectedEnrobage?.id !== "nori") {
                  const option = toppingOptions.find(opt => opt.id === value);
                  setSelectedTopping(option || null);
                }
              }}
              disabled={selectedEnrobage?.id === "nori"}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {toppingOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem 
                      value={option.id} 
                      id={`topping-${option.id}`} 
                      disabled={selectedEnrobage?.id === "nori"}
                    />
                    <Label 
                      htmlFor={`topping-${option.id}`}
                      className={selectedEnrobage?.id === "nori" ? "text-gray-400" : ""}
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
            <h3 className="text-xl font-bold mb-4">5 - Choisis ta sauce (1 choix inclus)</h3>
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

        <h1 className="text-3xl font-bold mb-2">SUSHI CRÉA</h1>
        <p className="text-gray-600 mb-6">Compose tes propres sushis !</p>

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
                  {calculateExtraCost() > 0 && (
                    <p className="text-xs text-gray-500">
                      (+{calculateExtraCost().toFixed(2)}€ suppléments)
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
                onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              >
                {step > 1 ? "Précédent" : "Annuler"}
              </Button>
              <Button onClick={handleNext}>
                {step < 6 ? "Continuer" : "Ajouter au panier"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {step === 6 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Récapitulatif de votre création</h3>
            <Card>
              <CardContent className="mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Box:</span>
                    <span>{selectedBox?.pieces} pièces ({selectedBox?.creations} créations)</span>
                  </div>
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
                  {(selectedTopping && selectedEnrobage?.id !== "nori") && (
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

export default ComposerSushi;
