import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Restaurant } from "@/types/restaurant";

interface BlockedTimeSlot {
  id: string;
  restaurant_id: string;
  blocked_date: string;
  blocked_time: string;
  reason?: string;
  created_at: string;
}

interface BlockedTimeSlotsManagerProps {
  selectedRestaurant?: Restaurant;
}

const BlockedTimeSlotsManager = ({ selectedRestaurant }: BlockedTimeSlotsManagerProps) => {
  const [blockedSlots, setBlockedSlots] = useState<BlockedTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    blocked_date: "",
    blocked_time: "",
    reason: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (selectedRestaurant) {
      fetchBlockedSlots();
    }
  }, [selectedRestaurant]);

  const fetchBlockedSlots = async () => {
    if (!selectedRestaurant) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_time_slots')
        .select('*')
        .eq('restaurant_id', selectedRestaurant.id)
        .order('blocked_date', { ascending: true })
        .order('blocked_time', { ascending: true });

      if (error) throw error;
      setBlockedSlots(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux bloqués:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les créneaux bloqués",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!selectedRestaurant || !newSlot.blocked_date || !newSlot.blocked_time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_time_slots')
        .insert([{
          restaurant_id: selectedRestaurant.id,
          blocked_date: newSlot.blocked_date,
          blocked_time: newSlot.blocked_time,
          reason: newSlot.reason || null
        }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Erreur",
            description: "Ce créneau est déjà bloqué",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Succès",
        description: "Créneau bloqué avec succès",
      });

      setNewSlot({ blocked_date: "", blocked_time: "", reason: "" });
      setIsDialogOpen(false);
      fetchBlockedSlots();
    } catch (error) {
      console.error('Erreur lors du blocage du créneau:', error);
      toast({
        title: "Erreur",
        description: "Impossible de bloquer le créneau",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Créneau débloqué avec succès",
      });

      fetchBlockedSlots();
    } catch (error) {
      console.error('Erreur lors du déblocage du créneau:', error);
      toast({
        title: "Erreur",
        description: "Impossible de débloquer le créneau",
        variant: "destructive",
      });
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 11; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  if (!selectedRestaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des créneaux bloqués</CardTitle>
          <CardDescription>
            Veuillez sélectionner un restaurant pour gérer les créneaux bloqués
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Créneaux bloqués - {selectedRestaurant.name}
        </CardTitle>
        <CardDescription>
          Bloquez des créneaux pour empêcher les réservations en ligne quand le restaurant est trop occupé
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Bloquer un nouveau créneau
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bloquer un créneau</DialogTitle>
              <DialogDescription>
                Sélectionnez la date et l'heure du créneau à bloquer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="blocked_date">Date</Label>
                <Input
                  id="blocked_date"
                  type="date"
                  value={newSlot.blocked_date}
                  onChange={(e) => setNewSlot({ ...newSlot, blocked_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label htmlFor="blocked_time">Heure</Label>
                <Select
                  value={newSlot.blocked_time}
                  onValueChange={(value) => setNewSlot({ ...newSlot, blocked_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Raison (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Trop de commandes en magasin"
                  value={newSlot.reason}
                  onChange={(e) => setNewSlot({ ...newSlot, reason: e.target.value })}
                />
              </div>
              <Button onClick={handleAddSlot} className="w-full">
                Bloquer le créneau
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-gold-500 animate-spin mx-auto" />
          </div>
        ) : blockedSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun créneau bloqué pour ce restaurant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">
                    {format(new Date(slot.blocked_date), 'EEEE d MMMM yyyy', { locale: fr })} à {slot.blocked_time}
                  </div>
                  {slot.reason && (
                    <div className="text-sm text-gray-500 mt-1">{slot.reason}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockedTimeSlotsManager;