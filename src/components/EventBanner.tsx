import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

interface ActiveEvent {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  event_date: string;
  preorder_start: string;
  preorder_end: string;
}

const EventBanner = () => {
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

  useEffect(() => {
    const fetchActiveEvent = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch active events where we're in the preorder period OR it's the event day
      // AND the event has an image
      const { data, error } = await supabase
        .from('special_events')
        .select('id, name, slug, image_url, event_date, preorder_start, preorder_end')
        .eq('is_active', true)
        .lte('preorder_start', today)
        .gte('event_date', today)
        .not('image_url', 'is', null)
        .limit(1)
        .single();

      if (!error && data && data.image_url) {
        setActiveEvent(data);
      }
    };

    fetchActiveEvent();
  }, []);

  if (!activeEvent || !activeEvent.image_url) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden pt-16 md:pt-20 mb-8 md:mb-12">
      <Link to="/commander" className="block">
        <div className="relative w-full aspect-[2/1] md:aspect-[3/1] lg:aspect-[3.5/1]">
          <img
            src={activeEvent.image_url}
            alt={activeEvent.name}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white space-y-3 px-4">
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-6 w-6 md:h-8 md:w-8 text-gold-400" />
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg">
                  {activeEvent.name}
                </h2>
                <Gift className="h-6 w-6 md:h-8 md:w-8 text-gold-400" />
              </div>
              <p className="text-sm md:text-base drop-shadow">
                Précommandez maintenant !
              </p>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Commander
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
};

export default EventBanner;
