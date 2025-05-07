
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

    // Setup the initial homepage data if it doesn't exist
    try {
      // Use a raw query to check if homepage_sections table exists
      // @ts-ignore - Type safety will be resolved when Supabase types are regenerated
      const { data: tableExists } = await supabase.rpc('check_table_exists', {
        table_name: 'homepage_sections'
      }).single();
      
      if (tableExists) {
        // Check if there's any data in the homepage_sections table
        // @ts-ignore - Type safety will be resolved when Supabase types are regenerated
        const { count, error: countError } = await supabase.rpc('count_table_rows', {
          table_name: 'homepage_sections'
        }).single();
        
        if (countError) {
          console.error('Error checking homepage_sections count:', countError);
          return;
        }
        
        if (count === 0) {
          console.log('No homepage data found, creating initial data using RPC function');
          
          // @ts-ignore - Type safety will be resolved when Supabase types are regenerated
          await supabase.rpc('insert_homepage_data');
          console.log('Initial homepage data created successfully');
        }
      } else {
        console.log('Homepage sections table does not exist yet');
      }
    } catch (err) {
      console.error('Error setting up homepage data:', err);
    }
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
};
