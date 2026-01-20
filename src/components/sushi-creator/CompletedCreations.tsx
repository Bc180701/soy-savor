
import { Card, CardContent } from "@/components/ui/card";
import { SushiCreation, BoxOption } from "@/types/sushi-creator";

interface CompletedCreationsProps {
  completedCreations: SushiCreation[];
  selectedBox: BoxOption | null;
}

export const CompletedCreations = ({ completedCreations, selectedBox }: CompletedCreationsProps) => {
  if (completedCreations.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold mb-4">Créations terminées ({completedCreations.length}/{selectedBox?.creations})</h3>
      <div className="space-y-4">
        {completedCreations.map((creation, index) => (
          <Card key={index}>
            <CardContent className="mt-4">
              <h4 className="font-semibold mb-2">Création {index + 1}</h4>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Enrobage:</span> {creation.enrobage?.name}</div>
                <div><span className="font-medium">Base:</span> {creation.base?.name}</div>
                <div><span className="font-medium">Garnitures:</span> {creation.garnitures.map(g => g.name).join(', ')}</div>
                {creation.toppings.length > 0 && <div><span className="font-medium">Toppings:</span> {creation.toppings.map(t => t.name).join(', ')}</div>}
                <div><span className="font-medium">Sauce:</span> {creation.sauce?.name}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
