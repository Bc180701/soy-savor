
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SushiIngredientsSection from "./ingredients/SushiIngredientsSection";
import PokeIngredientsSection from "./ingredients/PokeIngredientsSection";

const IngredientsManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Ingrédients</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sushi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sushi">Ingrédients Sushi</TabsTrigger>
            <TabsTrigger value="poke">Ingrédients Poke</TabsTrigger>
          </TabsList>
          <TabsContent value="sushi" className="mt-6">
            <SushiIngredientsSection />
          </TabsContent>
          <TabsContent value="poke" className="mt-6">
            <PokeIngredientsSection />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IngredientsManager;
