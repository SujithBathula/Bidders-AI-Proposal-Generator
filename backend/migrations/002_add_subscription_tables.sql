-- Migration: Add subscription and usage tracking tables
-- Date: 2025-09-09

-- Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('BASE', 'PREMIUM');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- Create usage type enum
CREATE TYPE usage_type AS ENUM ('PROPOSAL_GENERATION', 'PROPOSAL_DOWNLOAD', 'API_CALL');

-- Create subscriptions table
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_type subscription_plan NOT NULL,
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    proposal_limit INTEGER NOT NULL,
    downloads_used INTEGER NOT NULL DEFAULT 0,
    proposals_generated INTEGER NOT NULL DEFAULT 0,
    amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create usage records table
CREATE TABLE usage_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
    type usage_type NOT NULL,
    proposal_id TEXT REFERENCES proposals(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add downloadedAt to proposals table
ALTER TABLE proposals ADD COLUMN downloaded_at TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_records_company_id ON usage_records(company_id);
CREATE INDEX idx_usage_records_subscription_id ON usage_records(subscription_id);
CREATE INDEX idx_usage_records_type ON usage_records(type);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at);

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional)
-- This would be removed in production
/*
INSERT INTO subscriptions (
    company_id, 
    plan_type, 
    current_period_start, 
    current_period_end, 
    proposal_limit, 
    amount
) VALUES (
    (SELECT id FROM companies LIMIT 1),
    'BASE',
    NOW(),
    NOW() + INTERVAL '30 days',
    5,
    2200  -- $22 including GST in cents
);
*/
