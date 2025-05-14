
import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";

const OrderingLockControl = () => {
  const { isOrderingLocked, setOrderingLocked } = useCart();
  const [reason, setReason] = useState<string>("");
  const { toast } = useToast();

  const handleToggleLock = (checked: boolean) => {
    setOrderingLocked(checked);
    
    toast({
      title: checked ? "Commandes verrouillées" : "Commandes déverrouillées",
      description: checked 
        ? "Les clients ne peuvent plus passer de commandes." 
        : "Les clients peuvent à nouveau passer des commandes.",
      variant: checked ? "destructive" : "success",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        {isOrderingLocked ? 
          <><Lock className="h-5 w-5 text-red-500" /> Commandes verrouillées</> : 
          <><LockOpen className="h-5 w-5 text-green-500" /> Commandes actives</>
        }
      </h2>
      
      <div className="flex items-center space-x-2 mb-6">
        <Switch 
          checked={isOrderingLocked} 
          onCheckedChange={handleToggleLock}
          id="ordering-lock"
        />
        <Label htmlFor="ordering-lock">
          {isOrderingLocked ? "Verrouillé" : "Actif"}
        </Label>
      </div>

      <div className="text-sm text-gray-600">
        {isOrderingLocked ? (
          <p className="text-red-500">
            Les clients ne peuvent pas passer de commandes. Cette option est utile lors des fermetures exceptionnelles, congés, ou problèmes techniques.
          </p>
        ) : (
          <p className="text-green-500">
            Les clients peuvent passer des commandes normalement.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderingLockControl;
