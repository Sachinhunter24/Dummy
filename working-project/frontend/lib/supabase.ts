import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vwboosigwgwbhbbycgzi.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Ym9vc2lnd2d3YmhiYnljZ3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDY2MDEsImV4cCI6MjEwMDg4MjYwMX0.L7EMOGZC4qWdq9ENf5nZyTZxZYoHiTGVRYy78dmDeiI";

export const supabase = createClient(supabaseUrl, supabaseKey);
