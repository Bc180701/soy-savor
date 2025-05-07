
import { supabase } from "@/integrations/supabase/client";

export const setupStorage = async () => {
  try {
    console.info("Storage setup completed");
    
    // Setup the initial homepage data if it doesn't exist
    try {
      // Use a raw query to check if homepage_sections table exists
      const { data: tableExists, error: tableCheckError } = await supabase.rpc('check_table_exists', {
        table_name: 'homepage_sections'
      }).single();
      
      if (tableCheckError) {
        console.error('Error checking if table exists:', tableCheckError);
        return;
      }
      
      if (tableExists) {
        // Check if there's any data in the homepage_sections table
        const { data: countData, error: countError } = await supabase.rpc('count_table_rows', {
          table_name: 'homepage_sections'
        }).single();
        
        if (countError) {
          console.error('Error checking homepage_sections count:', countError);
          return;
        }
        
        const count = countData;
        if (count === 0) {
          console.log('No homepage data found, creating initial data using RPC function');
          
          const { error: insertError } = await supabase.rpc('insert_homepage_data');
          
          if (insertError) {
            console.error('Error inserting homepage data:', insertError);
          } else {
            console.log('Initial homepage data created successfully');
          }
        } else {
          console.log(`Found ${count} existing homepage sections, skipping initialization`);
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
