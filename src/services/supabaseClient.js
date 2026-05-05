import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kofloppyzfgrrfgualna.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZmxvcHB5emZncnJmZ3VhbG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzkyNTksImV4cCI6MjA5MzUxNTI1OX0.qYrR9FFozS_J2c2DxfrMbIjQVWV0NgNzRDYDzZgkc6A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 👇 加這行（關鍵）
window.supabase = supabase;