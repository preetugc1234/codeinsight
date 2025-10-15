-- ============================================
-- Code Insight - Annual Billing (20% Discount) Migration
-- Run this AFTER supabase-billing-migration.sql
-- ============================================

-- Add annual billing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'annual' CHECK (billing_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS annual_discount_percentage INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS current_price NUMERIC(10, 2) DEFAULT 0.00;

-- Create index for billing cycle queries
CREATE INDEX IF NOT EXISTS profiles_billing_cycle_idx ON public.profiles(billing_cycle);

-- Create function to calculate price based on plan and billing cycle
CREATE OR REPLACE FUNCTION public.get_plan_price(plan_name TEXT, cycle TEXT)
RETURNS NUMERIC AS $$
DECLARE
  base_monthly_price NUMERIC;
  final_price NUMERIC;
BEGIN
  -- Get base monthly price
  CASE plan_name
    WHEN 'trial' THEN base_monthly_price := 0;
    WHEN 'lite' THEN base_monthly_price := 15;
    WHEN 'pro' THEN base_monthly_price := 30;
    WHEN 'business' THEN base_monthly_price := 200;
    ELSE base_monthly_price := 0;
  END CASE;

  -- Apply 20% discount for annual billing
  IF cycle = 'annual' THEN
    final_price := base_monthly_price * 0.80;  -- 20% off
  ELSE
    final_price := base_monthly_price;
  END IF;

  RETURN final_price;
END;
$$ LANGUAGE plpgsql;

-- Create function to get annual total price
CREATE OR REPLACE FUNCTION public.get_annual_total(plan_name TEXT)
RETURNS NUMERIC AS $$
DECLARE
  monthly_discounted_price NUMERIC;
  annual_total NUMERIC;
BEGIN
  monthly_discounted_price := public.get_plan_price(plan_name, 'annual');
  annual_total := monthly_discounted_price * 12;
  RETURN annual_total;
END;
$$ LANGUAGE plpgsql;

-- Update the set_trial_period trigger function to set billing cycle and price
CREATE OR REPLACE FUNCTION public.set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial end date to 7 days from signup for new users
  IF NEW.trial_start_date IS NOT NULL AND NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date = NEW.trial_start_date + INTERVAL '7 days';
  END IF;

  -- Set billing period end based on billing cycle
  IF NEW.billing_period_start IS NOT NULL AND NEW.billing_period_end IS NULL THEN
    IF NEW.billing_cycle = 'annual' THEN
      NEW.billing_period_end = NEW.billing_period_start + INTERVAL '365 days';
    ELSE
      NEW.billing_period_end = NEW.billing_period_start + INTERVAL '30 days';
    END IF;
  END IF;

  -- Set token limits based on plan
  IF NEW.plan = 'trial' THEN
    NEW.monthly_token_limit = 6000;
  ELSIF NEW.plan = 'lite' THEN
    NEW.monthly_token_limit = 200000;
  ELSIF NEW.plan = 'pro' THEN
    NEW.monthly_token_limit = 500000;
  ELSIF NEW.plan = 'business' THEN
    NEW.monthly_token_limit = 4000000;
  END IF;

  -- Set current price based on plan and billing cycle
  NEW.current_price = public.get_plan_price(NEW.plan, NEW.billing_cycle);

  -- Default to annual billing for new users (20% discount)
  IF NEW.billing_cycle IS NULL THEN
    NEW.billing_cycle = 'annual';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing users to annual billing (20% discount by default)
UPDATE public.profiles
SET
  billing_cycle = 'annual',
  current_price = public.get_plan_price(plan, 'annual'),
  billing_period_end = billing_period_start + INTERVAL '365 days'
WHERE billing_cycle IS NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_plan_price TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_annual_total TO authenticated;

COMMENT ON COLUMN public.profiles.billing_cycle IS 'Billing cycle: annual (20% off, default) or monthly';
COMMENT ON COLUMN public.profiles.annual_discount_percentage IS 'Discount percentage for annual billing (default 20%)';
COMMENT ON COLUMN public.profiles.current_price IS 'Current monthly price based on plan and billing cycle';

-- Pricing Reference:
-- ANNUAL (20% discount):
--   Trial: $0/mo
--   Lite: $12/mo ($144/year) - was $15/mo ($180/year) - SAVES $36/year
--   Pro: $24/mo ($288/year) - was $30/mo ($360/year) - SAVES $72/year
--   Business: $160/mo ($1,920/year) - was $200/mo ($2,400/year) - SAVES $480/year
--
-- MONTHLY (no discount):
--   Trial: $0/mo
--   Lite: $15/mo
--   Pro: $30/mo
--   Business: $200/mo
