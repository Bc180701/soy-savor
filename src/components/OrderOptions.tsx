
import { Truck, ShoppingBag, Users } from "lucide-react";

interface OrderOption {
  title: string;
  description: string;
  icon: string;
}

interface OrderOptionsProps {
  options: OrderOption[];
}

export const OrderOptions = ({ options }: OrderOptionsProps) => {
  // Function to render the correct icon based on the icon name
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Truck":
        return <Truck size={36} className="text-gold-600" />;
      case "ShoppingBag":
        return <ShoppingBag size={36} className="text-gold-600" />;
      case "Users":
        return <Users size={36} className="text-gold-600" />;
      default:
        return null;
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 better-times-gold">Comment commander ?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choisissez la méthode qui vous convient le mieux pour déguster nos délicieux sushis !
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((option, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="flex justify-center mb-4">
                {renderIcon(option.icon)}
              </div>
              <h3 className="text-xl font-bold mb-2 better-times-gold">{option.title}</h3>
              <p className="text-gray-600">{option.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
