
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";

export const OrderCTA = () => {
  return (
    <section className="py-8 bg-gold-600 text-white">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold">Envie de sushi aujourd'hui ?</h2>
          <p className="text-gold-100">Commandez en ligne ou appelez-nous !</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="destructive" className="bg-gold-500 hover:bg-gold-600 text-black">
            <Link to="/commander" className="flex items-center">
              Commander en ligne <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="border-white text-white hover:bg-white/20">
            <a href="tel:+33490000000" className="flex items-center">
              <Phone className="mr-2 h-4 w-4" /> 04 90 00 00 00
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
