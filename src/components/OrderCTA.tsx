
import { Button } from "@/components/ui/button";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const OrderCTA = () => {
  const { isOrderingLocked } = useCart();

  if (isOrderingLocked) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Alert variant="destructive" className="mb-8 border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Commandes temporairement fermées</AlertTitle>
          <AlertDescription>
            Nous ne prenons pas de commandes pour le moment. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-center relative">
      {/* Logo en arrière-plan */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <img 
          src="/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png" 
          alt="Logo" 
          className="w-96 h-auto"
        />
      </div>
      <h2 className="text-3xl font-bold mb-4 better-times-gold relative z-10">Envie de sushi?</h2>
      <p className="text-gray-600 mb-8 max-w-xl mx-auto relative z-10">
        Commandez en ligne et dégustez nos délicieux plats préparés avec soin par nos chefs.
        Livraison à domicile ou à emporter.
      </p>
      <Button asChild size="lg" className="rounded-full px-8 transition-all relative z-10">
        <Link to="/commander" className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Commander maintenant
        </Link>
      </Button>
    </div>
  );
};

export default OrderCTA;
