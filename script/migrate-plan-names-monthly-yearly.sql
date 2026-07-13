-- Rename stored subscription plan_name values to cycle-specific names.
-- Safe to re-run: only updates matching legacy short names.
-- Does NOT change pricing, limits, billing_cycle, or schema.

BEGIN;

-- Parents: Starter
UPDATE users
SET plan_name = 'Starter Monthly'
WHERE LOWER(TRIM(plan_name)) IN ('starter', 'starter (monthly)')
  AND LOWER(COALESCE(billing_cycle, 'monthly')) = 'monthly';

UPDATE users
SET plan_name = 'Starter Yearly'
WHERE LOWER(TRIM(plan_name)) IN ('starter', 'starter (yearly)', 'starter annual', 'starter (annual)')
  AND LOWER(COALESCE(billing_cycle, '')) IN ('yearly', 'annual');

-- Parents: Growth
UPDATE users
SET plan_name = 'Growth Monthly'
WHERE LOWER(TRIM(plan_name)) IN ('growth', 'growth (monthly)')
  AND LOWER(COALESCE(billing_cycle, 'monthly')) = 'monthly';

UPDATE users
SET plan_name = 'Growth Yearly'
WHERE LOWER(TRIM(plan_name)) IN ('growth', 'growth (yearly)', 'growth annual', 'growth (annual)')
  AND LOWER(COALESCE(billing_cycle, '')) IN ('yearly', 'annual');

-- Professionals: Starter Pro
UPDATE users
SET plan_name = 'Starter Pro Monthly'
WHERE LOWER(TRIM(plan_name)) IN ('starter pro', 'starter pro (monthly)')
  AND LOWER(COALESCE(billing_cycle, 'monthly')) = 'monthly';

UPDATE users
SET plan_name = 'Starter Pro Yearly'
WHERE LOWER(TRIM(plan_name)) IN ('starter pro', 'starter pro (yearly)', 'starter pro annual', 'starter pro (annual)')
  AND LOWER(COALESCE(billing_cycle, '')) IN ('yearly', 'annual');

-- Professionals: Growth Pro
UPDATE users
SET plan_name = 'Growth Pro Monthly'
WHERE LOWER(TRIM(plan_name)) IN ('growth pro', 'growth pro (monthly)')
  AND LOWER(COALESCE(billing_cycle, 'monthly')) = 'monthly';

UPDATE users
SET plan_name = 'Growth Pro Yearly'
WHERE LOWER(TRIM(plan_name)) IN ('growth pro', 'growth pro (yearly)', 'growth pro annual', 'growth pro (annual)')
  AND LOWER(COALESCE(billing_cycle, '')) IN ('yearly', 'annual');

-- Paid users with short plan names but missing billing_cycle → treat as Monthly
UPDATE users
SET plan_name = 'Starter Monthly'
WHERE LOWER(TRIM(plan_name)) = 'starter'
  AND (billing_cycle IS NULL OR TRIM(billing_cycle) = '');

UPDATE users
SET plan_name = 'Growth Monthly'
WHERE LOWER(TRIM(plan_name)) = 'growth'
  AND (billing_cycle IS NULL OR TRIM(billing_cycle) = '');

UPDATE users
SET plan_name = 'Starter Pro Monthly'
WHERE LOWER(TRIM(plan_name)) = 'starter pro'
  AND (billing_cycle IS NULL OR TRIM(billing_cycle) = '');

UPDATE users
SET plan_name = 'Growth Pro Monthly'
WHERE LOWER(TRIM(plan_name)) = 'growth pro'
  AND (billing_cycle IS NULL OR TRIM(billing_cycle) = '');

COMMIT;
