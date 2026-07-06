import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://jhddymyvrrvyayafnuem.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZGR5bXl2cnJ2eWF5YWZudWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTc4MzUsImV4cCI6MjA5ODY3MzgzNX0.WJB4IsxQD43xATw-Tw-t2-q0VOxLdtf-mFDpID6tGNI'
);
