
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useCart } from "./hooks/use-cart";
import { useOrder } from "./hooks/use-order";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Commander from "./pages/Commander";
import APropos from "./pages/APropos";
import Contact from "./pages/Contact";
import Panier from "./pages/Panier";
import Compte from "./pages/Compte";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import ComposerSushi from "./pages/ComposerSushi";
import ComposerPoke from "./pages/ComposerPoke";

const queryClient = new QueryClient();

function App() {
  // Initialiser les stores persistés après le chargement de la page
  const hydrate = () => {
    useCart.persist.rehydrate();
    useOrder.persist.rehydrate();
  };

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Outlet /></Layout>}>
              <Route index element={<Index />} />
              <Route path="menu" element={<Menu />} />
              <Route path="commander" element={<Commander />} />
              <Route path="composer-sushi" element={<ComposerSushi />} />
              <Route path="composer-poke" element={<ComposerPoke />} />
              <Route path="a-propos" element={<APropos />} />
              <Route path="contact" element={<Contact />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="update-password" element={<UpdatePassword />} />
              <Route path="compte" element={<Compte />} />
              <Route path="panier" element={<Panier />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
