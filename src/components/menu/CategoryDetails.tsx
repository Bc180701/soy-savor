
import { Separator } from "@/components/ui/separator";
import { MenuCategory } from "@/types";

interface CategoryDetailsProps {
  category: MenuCategory;
}

const CategoryDetails = ({ category }: CategoryDetailsProps) => {
  // Special descriptions for specific categories
  const specialDescriptions: Record<string, string> = {
    'box_du_midi': 'Midi uniquement de 11h à 14h. Accompagnements offerts : riz, salade de choux, soupe miso',
    'plateaux': 'Assortiments variés pour tous les goûts',
    'yakitori': 'Brochette et fritures japonaises',
    'gunkan': 'Riz & garniture entouré d\'algue nori',
    'sashimi': 'Tranches de poisson cru ou légèrement snacké',
    'poke': 'Bol composé de riz, protéines, légumes et sauce',
    'chirashi': 'Riz surmonté de lamelles de protéine',
    'maki': 'Rouleau d\'algue nori, riz vinaigré et garniture',
    'california': 'Rouleau inversé, riz à l\'extérieur',
    'crispy': 'Rouleau inversé, riz à l\'extérieur garni d\'oignon frit',
    'spring': 'Rouleau frais entouré de feuille de riz',
    'salmon': 'Rouleau enrobé de saumon',
    'green': 'Rouleau enrobé d\'avocat',
    'nigiri': 'Boule de riz vinaigré surmontée d\'une tranche de poisson',
    'signature': 'Les sushis by Sushieats',
    'temaki': 'Cône d\'algue nori garni',
    'maki_wrap': 'Wrap de sushi Maki, roulé d\'algue nori avec riz vinaigré et garniture'
  };

  // Use the special description if available, otherwise use the category description
  const description = specialDescriptions[category.id] || category.description;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold bg-akane-600 text-white px-4 py-2 rounded-md">{category.name}</h2>
      {description && (
        <p className="text-gray-600 italic mt-2 mb-2">{description}</p>
      )}
      <Separator className="my-4" />
    </div>
  );
};

export default CategoryDetails;
