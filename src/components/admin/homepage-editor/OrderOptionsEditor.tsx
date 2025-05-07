
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash } from "lucide-react";

interface OrderOption {
  title: string;
  description: string;
  icon: string;
}

interface OrderOptionsEditorProps {
  data: OrderOption[];
  onSave: (data: OrderOption[]) => void;
}

const OrderOptionsEditor = ({ data, onSave }: OrderOptionsEditorProps) => {
  const [options, setOptions] = useState<OrderOption[]>(data);

  const iconOptions = [
    "Truck",
    "ShoppingBag",
    "Users",
    "Clock",
    "MapPin",
    "CreditCard"
  ];

  const handleChange = (index: number, field: string, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    };
    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([
      ...options,
      {
        title: "Nouvelle option",
        description: "Description de l'option",
        icon: "Truck",
      },
    ]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(options);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {options.map((option, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Option {index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input
                        value={option.title}
                        onChange={(e) => handleChange(index, 'title', e.target.value)}
                        placeholder="Titre de l'option"
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Icône</FormLabel>
                    <FormControl>
                      <Select 
                        value={option.icon} 
                        onValueChange={(value) => handleChange(index, 'icon', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une icône" />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                </div>

                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      value={option.description}
                      onChange={(e) => handleChange(index, 'description', e.target.value)}
                      placeholder="Description de l'option"
                      rows={2}
                    />
                  </FormControl>
                </FormItem>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          className="w-full py-6 border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" /> Ajouter une option
        </Button>
      </div>

      <Separator className="my-6" />

      <div>
        <Button type="submit" className="bg-gold-600 hover:bg-gold-700 text-white">
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
};

export default OrderOptionsEditor;
