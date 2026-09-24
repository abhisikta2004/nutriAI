-- ==============================================================================
-- NutriAI Complete Database Schema (Supabase PostgreSQL)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. PROFILES TABLE (User Physical Attributes & Goals)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  current_body_type TEXT DEFAULT 'average',
  target_body_type TEXT DEFAULT 'athletic',
  weight NUMERIC DEFAULT 70,
  height NUMERIC DEFAULT 170,
  age INTEGER DEFAULT 25,
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  diet_preference TEXT DEFAULT 'all',
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
  ON public.profiles FOR DELETE 
  USING (auth.uid() = id);


-- 2. SCANNED MEALS & FOOD JOURNAL TABLE
CREATE TABLE IF NOT EXISTS public.scanned_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  original_dish_name TEXT,
  scanned_image_url TEXT,
  logged_choice_type TEXT DEFAULT 'original' CHECK (logged_choice_type IN ('original', 'healthier_alternative')),
  alternative_name TEXT,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  saturated_fat NUMERIC,
  fiber NUMERIC,
  sugar NUMERIC,
  sodium NUMERIC,
  source TEXT DEFAULT 'NutriAI Scanner',
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for scanned_meals
ALTER TABLE public.scanned_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scanned meals" 
  ON public.scanned_meals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scanned meals" 
  ON public.scanned_meals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scanned meals" 
  ON public.scanned_meals FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned meals" 
  ON public.scanned_meals FOR DELETE 
  USING (auth.uid() = user_id);


-- 3. APPLE HEALTH ACTIVITY TABLE
CREATE TABLE IF NOT EXISTS public.apple_health_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  active_energy_burned NUMERIC DEFAULT 0,
  step_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_activity UNIQUE (user_id)
);

-- Enable RLS for apple_health_activity
ALTER TABLE public.apple_health_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" 
  ON public.apple_health_activity FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" 
  ON public.apple_health_activity FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity" 
  ON public.apple_health_activity FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 4. AUTOMATIC NEW USER TRIGGER
-- Automatically creates a profile row when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, has_completed_onboarding)
  VALUES (new.id, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
