
/// <reference types="vite/client" />

// Extending Supabase RPC types to include our custom functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = any>(
      fn: 
        | 'check_table_exists' 
        | 'count_table_rows' 
        | 'get_homepage_data' 
        | 'has_role' 
        | 'insert_homepage_data' 
        | 'update_homepage_data'
        | 'update_all_products_status',
      params?: object
    ): { data: T; error: Error }
  }
}
