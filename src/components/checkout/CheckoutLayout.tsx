
import React from "react";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CheckoutLayoutProps {
  children: React.ReactNode;
  cartIsEmpty?: boolean;
}

const CheckoutLayout = ({ children, cartIsEmpty = false }: CheckoutLayoutProps) => {
  if (cartIsEmpty) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
            <h2 className="text-2xl font-semibold">Votre panier est vide</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore ajouté d'articles à votre panier
            </p>
            <Button asChild className="bg-gold-600 hover:bg-gold-700">
              <Link to="/commander">
                Découvrir notre menu
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {children}
    </div>
  );
};

export default CheckoutLayout;
