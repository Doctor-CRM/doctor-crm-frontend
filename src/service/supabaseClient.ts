import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qqfgsspyyfaaccaydote.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4ljbyetTbobokqKz4vVEjQ_VruavKoh";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
