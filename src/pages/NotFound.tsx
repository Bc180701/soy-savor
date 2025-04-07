
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-9xl font-bold text-gold-600">404</h1>
          <div className="w-16 h-1 bg-gold-600 mx-auto my-6"></div>
          <h2 className="text-2xl font-medium text-gray-900 mb-4">
            Page introuvable
          </h2>
          <p className="text-gray-600 mb-8">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gold-600 hover:bg-gold-700">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" /> Retour à l'accueil
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gold-200 text-gold-600 hover:bg-gold-50">
              <Link to="/menu">
                Voir notre menu
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
