
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

interface DayHours {
  day: string;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const OpeningHoursManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingHours, setOpeningHours] = useState<DayHours[]>([
    { day: "monday", dayName: "Lundi", isOpen: false, openTime: "11:00", closeTime: "22:00" },
    { day: "tuesday", dayName: "Mardi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "wednesday", dayName: "Mercredi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "thursday", dayName: "Jeudi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "friday", dayName: "Vendredi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "saturday", dayName: "Samedi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "sunday", dayName: "Dimanche", isOpen: false, openTime: "11:00", closeTime: "22:00" }
  ]);

  const fetchOpeningHours = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('section_data')
        .eq('section_name', 'opening_hours')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.section_data) {
        // Convert from DayOpeningHours to our component state format
        const dbHours = data.section_data as Array<{
          day: string;
          is_open: boolean;
          open_time: string;
          close_time: string;
          day_order: number;
        }>;
        
        // Map database data to our state format
        const formattedData = dbHours.map(item => ({
          day: item.day,
          dayName: getDayName(item.day),
          isOpen: item.is_open,
          openTime: item.open_time,
          closeTime: item.close_time
        }));
        
        setOpeningHours(formattedData);
      }
    } catch (error) {
      console.error("Error loading opening hours:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les horaires d'ouverture",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getDayName = (day: string): string => {
    const dayNames: {[key: string]: string} = {
      "monday": "Lundi",
      "tuesday": "Mardi", 
      "wednesday": "Mercredi",
      "thursday": "Jeudi",
      "friday": "Vendredi",
      "saturday": "Samedi",
      "sunday": "Dimanche"
    };
    return dayNames[day] || day;
  };

  const handleDayToggle = (index: number) => {
    const updatedHours = [...openingHours];
    updatedHours[index].isOpen = !updatedHours[index].isOpen;
    setOpeningHours(updatedHours);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    const updatedHours = [...openingHours];
    updatedHours[index][field] = value;
    setOpeningHours(updatedHours);
  };

  const saveOpeningHours = async () => {
    try {
      setSaving(true);
      console.log("Début de la sauvegarde des horaires d'ouverture");
      
      // Convert our state format to database format
      const dbData = openingHours.map((item, index) => ({
        day: item.day,
        day_order: index,
        is_open: item.isOpen,
        open_time: item.openTime,
        close_time: item.closeTime
      }));
      
      console.log("Données à sauvegarder:", dbData);
      
      // Première tentative : vérifier si l'enregistrement existe
      const { data: existingData, error: selectError } = await supabase
        .from('homepage_sections')
        .select('id')
        .eq('section_name', 'opening_hours')
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }
      
      let result;
      
      if (existingData) {
        // Mise à jour de l'enregistrement existant
        console.log("Mise à jour de l'enregistrement existant");
        result = await supabase
          .from('homepage_sections')
          .update({ 
            section_data: dbData,
            updated_at: new Date().toISOString()
          })
          .eq('section_name', 'opening_hours');
      } else {
        // Création d'un nouvel enregistrement
        console.log("Création d'un nouvel enregistrement");
        result = await supabase
          .from('homepage_sections')
          .insert({ 
            section_name: 'opening_hours',
            section_data: dbData
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      console.log("Horaires sauvegardés avec succès");
      
      toast({
        title: "Horaires sauvegardés",
        description: "Les horaires d'ouverture ont été mis à jour avec succès",
      });
      
    } catch (error) {
      console.error("Error saving opening hours:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les horaires d'ouverture",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  useEffect(() => {
    fetchOpeningHours();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horaires d'ouverture</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 font-semibold pb-2 border-b">
              <div>Jour</div>
              <div>Ouvert</div>
              <div>Heure d'ouverture</div>
              <div>Heure de fermeture</div>
            </div>
            
            {openingHours.map((day, index) => (
              <div key={day.day} className="grid grid-cols-4 gap-4 items-center">
                <div className="font-medium">{day.dayName}</div>
                <div>
                  <Checkbox 
                    checked={day.isOpen} 
                    onCheckedChange={() => handleDayToggle(index)}
                    id={`day-${day.day}`}
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={day.openTime}
                    onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                    disabled={!day.isOpen}
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={day.closeTime}
                    onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                    disabled={!day.isOpen}
                  />
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-end">
              <Button onClick={saveOpeningHours} disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder les horaires
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpeningHoursManager;
