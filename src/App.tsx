
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
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
            <Route
              path="/"
              element={
                <Layout>
                  <Index />
                </Layout>
              }
            />
            <Route
              path="/menu"
              element={
                <Layout>
                  <Menu />
                </Layout>
              }
            />
            <Route
              path="/commander"
              element={
                <Layout>
                  <Commander />
                </Layout>
              }
            />
            <Route
              path="/a-propos"
              element={
                <Layout>
                  <APropos />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />
            <Route
              path="/panier"
              element={
                <Layout>
                  <Panier />
                </Layout>
              }
            />
            <Route
              path="/compte"
              element={
                <Layout>
                  <Compte />
                </Layout>
              }
            />
            <Route
              path="/admin"
              element={
                <Layout>
                  <Admin />
                </Layout>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
