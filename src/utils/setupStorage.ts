
import { supabase } from "@/integrations/supabase/client";

export const setupStorage = async () => {
  try {
    // Check if homepage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(b => b.name === 'homepage')) {
      // Create homepage bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('homepage', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating homepage bucket:', error);
      } else {
        console.log('Homepage bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
};
