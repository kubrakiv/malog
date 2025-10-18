-- SQL script to insert subscription plans data
-- Run this in PgAdmin to load subscription plan fixtures

-- Insert Base Plan
INSERT INTO base_subscriptionplan (
    id, 
    name, 
    display_name, 
    description, 
    truck_limit, 
    monthly_price, 
    yearly_price, 
    features, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    1,
    'base',
    'Base Plan',
    'Perfect for small businesses starting their logistics journey. Get essential fleet management tools with basic features to manage up to 3 trucks efficiently.',
    3,
    29.99,
    299.99,
    '["Fleet Management", "Driver Management", "Route Planner", "Orders Management", "Basic Support"]'::jsonb,
    true,
    '2025-10-07T10:00:00Z'::timestamptz,
    '2025-10-07T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    truck_limit = EXCLUDED.truck_limit,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert Pro Plan
INSERT INTO base_subscriptionplan (
    id, 
    name, 
    display_name, 
    description, 
    truck_limit, 
    monthly_price, 
    yearly_price, 
    features, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    2,
    'pro',
    'Pro Plan',
    'Ideal for growing logistics companies. Advanced features including route optimization, customer management, and comprehensive reporting for up to 10 trucks.',
    10,
    79.99,
    799.99,
    '["Fleet Management", "Driver Management", "Route Planner", "Orders Management", "Route Calculator", "Points Management", "Invoicing", "Customer Management", "Advanced Analytics", "Priority Support"]'::jsonb,
    true,
    '2025-10-07T10:00:00Z'::timestamptz,
    '2025-10-07T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    truck_limit = EXCLUDED.truck_limit,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert Unlimited Plan
INSERT INTO base_subscriptionplan (
    id, 
    name, 
    display_name, 
    description, 
    truck_limit, 
    monthly_price, 
    yearly_price, 
    features, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    3,
    'unlimited',
    'Unlimited Plan',
    'For large enterprises with extensive logistics operations. Unlimited trucks, all premium features, white-label options, and dedicated support.',
    -1,
    199.99,
    1999.99,
    '["Fleet Management", "Driver Management", "Route Planner", "Orders Management", "Route Calculator", "Points Management", "Invoicing", "Customer Management", "Tasks Management", "Live Map", "Dashboard", "System Administration", "Advanced Analytics", "API Access", "White Label Options", "Dedicated Support", "Custom Integrations"]'::jsonb,
    true,
    '2025-10-07T10:00:00Z'::timestamptz,
    '2025-10-07T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    truck_limit = EXCLUDED.truck_limit,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Reset the sequence to ensure proper auto-increment for future records
SELECT setval('base_subscriptionplan_id_seq', (SELECT MAX(id) FROM base_subscriptionplan));

-- Verify the data was inserted correctly
SELECT id, name, display_name, truck_limit, monthly_price, yearly_price, 
       array_length(features, 1) as feature_count, is_active
FROM base_subscriptionplan 
ORDER BY id;