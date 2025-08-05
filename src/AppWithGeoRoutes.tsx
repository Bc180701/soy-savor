import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";

// Pages principales
import Index from "@/pages/Index";
import Menu from "@/pages/Menu";
import Commander from "@/pages/Commander";
import Contact from "@/pages/Contact";
import Panier from "@/pages/Panier";
import ComposerSushi from "@/pages/ComposerSushi";
import ComposerPoke from "@/pages/ComposerPoke";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Compte from "@/pages/Compte";
import Admin from "@/pages/Admin";
import AdminCommandes from "@/pages/AdminCommandes";
import CommandeConfirmee from "@/pages/CommandeConfirmee";
import MentionsLegales from "@/pages/MentionsLegales";
import NosRestaurants from "@/pages/NosRestaurants";
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import NotFound from "@/pages/NotFound";

// Pages géographiques pour SEO (non liées dans la navigation)
import LivraisonChateaurenard from "@/pages/geo/LivraisonChateaurenard";
import LivraisonStMartinDeCrau from "@/pages/geo/LivraisonStMartinDeCrau";
import RestaurantJaponaisBouchesDuRhone from "@/pages/geo/RestaurantJaponaisBouchesDuRhone";

// Pages par villes
import {
  LivraisonEyragues,
  LivraisonBarbentane, 
  LivraisonGraveson,
  LivraisonMaillane,
  LivraisonNoves,
  LivraisonRognonas,
  LivraisonSaintRemyDeProvence,
  LivraisonParadou,
  LivraisonMaussanelesAlpilles,
  LivraisonMouries,
  LivraisonPontdeCrau,
  LivraisonRapheleLesArles,
  LivraisonMoules,
  LivraisonMasThibert
} from "@/pages/geo/CityPages";

// Pages par codes postaux
import Sushi13160 from "@/pages/geo/Sushi13160";
import Sushi13310 from "@/pages/geo/Sushi13310";
import {
  Sushi13630,
  Sushi13570,
  Sushi13690,
  Sushi13910,
  Sushi13550,
  Sushi13870,
  Sushi13210,
  Sushi13520,
  Sushi13890,
  Sushi13200,
  Sushi13280,
  Sushi13104
} from "@/pages/geo/PostalCodePages";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RestaurantProvider>
          <Toaster />
          <Sonner />
          <Router>
      <Routes>
        {/* Pages principales avec Layout */}
        <Route path="/" element={<Layout><Index /></Layout>} />
        <Route path="/menu" element={<Layout><Menu /></Layout>} />
        <Route path="/commander" element={<Layout><Commander /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/panier" element={<Layout><Panier /></Layout>} />
        <Route path="/composer-sushi" element={<Layout><ComposerSushi /></Layout>} />
        <Route path="/composer-poke" element={<Layout><ComposerPoke /></Layout>} />
        <Route path="/compte" element={<Layout><Compte /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/admin/commandes" element={<AdminCommandes />} />
        <Route path="/commande-confirmee" element={<Layout><CommandeConfirmee /></Layout>} />
        <Route path="/mentions-legales" element={<Layout><MentionsLegales /></Layout>} />
        <Route path="/nos-restaurants" element={<Layout><NosRestaurants /></Layout>} />
        
        {/* Pages sans Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* Pages géographiques pour SEO - Principales */}
        <Route path="/livraison-sushi-chateaurenard" element={<Layout><LivraisonChateaurenard /></Layout>} />
        <Route path="/livraison-sushi-saint-martin-de-crau" element={<Layout><LivraisonStMartinDeCrau /></Layout>} />
        <Route path="/restaurant-japonais-bouches-du-rhone" element={<Layout><RestaurantJaponaisBouchesDuRhone /></Layout>} />

        {/* Pages par villes - Zone Châteaurenard */}
        <Route path="/livraison-sushi-eyragues" element={<Layout><LivraisonEyragues /></Layout>} />
        <Route path="/livraison-sushi-barbentane" element={<Layout><LivraisonBarbentane /></Layout>} />
        <Route path="/livraison-sushi-graveson" element={<Layout><LivraisonGraveson /></Layout>} />
        <Route path="/livraison-sushi-maillane" element={<Layout><LivraisonMaillane /></Layout>} />
        <Route path="/livraison-sushi-noves" element={<Layout><LivraisonNoves /></Layout>} />
        <Route path="/livraison-sushi-rognonas" element={<Layout><LivraisonRognonas /></Layout>} />
        <Route path="/livraison-sushi-saint-remy-de-provence" element={<Layout><LivraisonSaintRemyDeProvence /></Layout>} />

        {/* Pages par villes - Zone Saint-Martin-de-Crau */}
        <Route path="/livraison-sushi-paradou" element={<Layout><LivraisonParadou /></Layout>} />
        <Route path="/livraison-sushi-maussane-les-alpilles" element={<Layout><LivraisonMaussanelesAlpilles /></Layout>} />
        <Route path="/livraison-sushi-mouries" element={<Layout><LivraisonMouries /></Layout>} />
        <Route path="/livraison-sushi-pont-de-crau" element={<Layout><LivraisonPontdeCrau /></Layout>} />
        <Route path="/livraison-sushi-raphele-les-arles" element={<Layout><LivraisonRapheleLesArles /></Layout>} />
        <Route path="/livraison-sushi-moules" element={<Layout><LivraisonMoules /></Layout>} />
        <Route path="/livraison-sushi-mas-thibert" element={<Layout><LivraisonMasThibert /></Layout>} />

        {/* Pages par codes postaux */}
        <Route path="/sushi-13160" element={<Layout><Sushi13160 /></Layout>} />
        <Route path="/sushi-13310" element={<Layout><Sushi13310 /></Layout>} />
        <Route path="/sushi-13630" element={<Layout><Sushi13630 /></Layout>} />
        <Route path="/sushi-13570" element={<Layout><Sushi13570 /></Layout>} />
        <Route path="/sushi-13690" element={<Layout><Sushi13690 /></Layout>} />
        <Route path="/sushi-13910" element={<Layout><Sushi13910 /></Layout>} />
        <Route path="/sushi-13550" element={<Layout><Sushi13550 /></Layout>} />
        <Route path="/sushi-13870" element={<Layout><Sushi13870 /></Layout>} />
        <Route path="/sushi-13210" element={<Layout><Sushi13210 /></Layout>} />
        <Route path="/sushi-13520" element={<Layout><Sushi13520 /></Layout>} />
        <Route path="/sushi-13890" element={<Layout><Sushi13890 /></Layout>} />
        <Route path="/sushi-13200" element={<Layout><Sushi13200 /></Layout>} />
        <Route path="/sushi-13280" element={<Layout><Sushi13280 /></Layout>} />
        <Route path="/sushi-13104" element={<Layout><Sushi13104 /></Layout>} />

        {/* 404 - Doit être en dernier */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Router>
        </RestaurantProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;