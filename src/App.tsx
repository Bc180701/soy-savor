
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Commander from "./pages/Commander";
import ComposerSushi from "./pages/ComposerSushi";
import ComposerPoke from "./pages/ComposerPoke";
import Panier from "./pages/Panier";
import Contact from "./pages/Contact";
import Compte from "./pages/Compte";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import CommandeConfirmee from "./pages/CommandeConfirmee";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import NosRestaurants from "./pages/NosRestaurants";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="menu" element={<Menu />} />
            <Route path="commander" element={<Commander />} />
            <Route path="composer-sushi" element={<ComposerSushi />} />
            <Route path="composer-poke" element={<ComposerPoke />} />
            <Route path="panier" element={<Panier />} />
            <Route path="contact" element={<Contact />} />
            <Route path="nos-restaurants" element={<NosRestaurants />} />
            <Route path="compte" element={<Compte />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="update-password" element={<UpdatePassword />} />
            <Route path="commande-confirmee/:orderId" element={<CommandeConfirmee />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
