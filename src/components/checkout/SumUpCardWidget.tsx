
import { useEffect, useRef } from "react";

interface SumUpCardWidgetProps {
  checkoutId: string;
  onSuccess: () => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    SumUpCard: {
      mount: (options: any) => {
        submit: () => void;
        unmount: () => void;
      };
    };
  }
}

const SumUpCardWidget = ({ checkoutId, onSuccess, onError }: SumUpCardWidgetProps) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardWidgetRef = useRef<any>(null);

  useEffect(() => {
    // Charger le script SumUp dynamiquement
    const script = document.createElement("script");
    script.src = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
    script.async = true;
    script.onload = initializeCardWidget;
    script.onerror = () => onError(new Error("Impossible de charger le script SumUp"));
    
    document.body.appendChild(script);
    
    return () => {
      // Nettoyer le widget et le script lors du démontage
      if (cardWidgetRef.current) {
        try {
          cardWidgetRef.current.unmount();
        } catch (e) {
          console.error("Erreur lors du démontage du widget SumUp:", e);
        }
      }
      document.body.removeChild(script);
    };
  }, [checkoutId]);

  const initializeCardWidget = () => {
    if (!window.SumUpCard || !cardContainerRef.current) {
      console.error("Le SDK SumUp n'a pas été chargé correctement ou le conteneur n'existe pas");
      return;
    }

    try {
      cardWidgetRef.current = window.SumUpCard.mount({
        checkoutId: checkoutId,
        onResponse: (type: string, body: any) => {
          console.log("SumUp widget response:", type, body);
          
          if (type === "success") {
            onSuccess();
          } else if (type === "error") {
            onError(body);
          }
        },
        showSubmitButton: true,
        locale: "fr-FR",
        // Identifiant merchant (optionnel si déjà configuré côté serveur)
        merchantCode: "MCK76924"
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation du widget SumUp:", error);
      onError(error);
    }
  };

  const handleSubmit = () => {
    if (cardWidgetRef.current) {
      cardWidgetRef.current.submit();
    }
  };

  return (
    <div className="space-y-6">
      <div ref={cardContainerRef} className="border rounded-lg p-4 bg-white shadow-sm min-h-[200px]"></div>
      
      <button 
        onClick={handleSubmit}
        className="w-full py-3 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-md shadow transition-colors"
      >
        Payer maintenant
      </button>
    </div>
  );
};

export default SumUpCardWidget;
