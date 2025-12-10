export type SubscriptionTier = 'starter' | 'professional' | 'business' | 'enterprise';

export type BillingCycle = 'monthly' | 'yearly';

export interface PricingPlan {
  tier: SubscriptionTier | string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  monthly_submissions: number | null;
  max_forms: number | null;
  max_team_members?: number | null;
  file_upload_size_mb?: number | null;
  support_level?: string | null;
  sla_uptime?: number | null;
  remove_branding?: boolean;
  white_label?: boolean;
  features: string[];
}

export interface PricingPlansResponse {
  plans: Record<string, PricingPlan>;
  currency?: string;
  updated_at?: string;
}

export interface SubscriptionUsage {
  user_id?: number;
  current_tier?: SubscriptionTier | string;
  billing_cycle?: BillingCycle;
  current_period_start?: string | null;
  next_reset_date?: string | null;
  days_remaining?: number | null;
  trial_ends_at: string | null;
  trial_days_remaining?: number | null;
  subscription_status: string | null;
  submissions_used?: number;
  submissions_limit?: number | null;
  submissions_remaining?: number | null;
  usage_percentage?: number | null;
  is_over_limit?: boolean;
  forms_count?: number | null;
  forms_limit?: number | null;
  overage_cost_cents?: number | null;
  overage_cost_formatted?: string | null;
  plan_name?: string;
  plan_price?: string;
  upgrade_available?: boolean;
}

export interface SubscriptionDetails {
  user_id?: number;
  tier?: SubscriptionTier | string;
  plan_name?: string;
  status?: string;
  subscription_status: string | null;
  billing_cycle?: BillingCycle;
  price_monthly?: number | null;
  price_yearly?: number | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  trial_ends_at: string | null;
  current_period_start?: string | null;
  next_billing_date?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  usage_info?: SubscriptionUsage;
  features?: string[];
  upgrade_available?: boolean;
}

export interface SubscriptionRecommendation {
  user_id?: number;
  current_tier?: SubscriptionTier | string;
  type?: 'upgrade' | 'downgrade' | string;
  recommended_tier?: SubscriptionTier | string;
  reason?: string;
  plan_name?: string;
  monthly_cost?: string;
  additional_submissions?: number;
}

export interface SubscriptionActionResponse {
  message: string;
  current_tier?: SubscriptionTier | string;
  target_tier?: SubscriptionTier | string;
  target_plan?: string;
  status?: string;
  billing_cycle?: BillingCycle;
  next_steps?: string[];
  effective_immediately?: boolean;
  effective_date?: string | null;
  savings?: number;
  price_change?: number;
  downgrade_to?: SubscriptionTier | string;
  active_until?: string | null;
}

export interface FeatureValidationResponse {
  has_access: boolean;
  feature: string;
  tier?: SubscriptionTier | string;
  error?: {
    error: string;
    message?: string;
    current_tier?: SubscriptionTier | string;
    feature?: string;
    upgrade_required?: {
      required_tier: SubscriptionTier | string;
      required_name?: string;
      required_price?: string;
    };
  };
}

export const PRICING_PLAN_FALLBACK: PricingPlansResponse = {
  currency: 'USD',
  updated_at: '2024-01-01T00:00:00Z',
  plans: {
    starter: {
      tier: 'starter',
      name: 'Starter',
      price_monthly: 900,
      price_yearly: 9000,
      monthly_submissions: 1000,
      max_forms: null,
      max_team_members: 1,
      file_upload_size_mb: 5,
      support_level: 'email',
      sla_uptime: 0.99,
      remove_branding: true,
      white_label: false,
      features: ['basic_analytics', 'email_notifications', 'api_access', 'email_support', 'basic_integrations', 'remove_branding']
    },
    professional: {
      tier: 'professional',
      name: 'Professional',
      price_monthly: 2900,
      price_yearly: 29000,
      monthly_submissions: 10000,
      max_forms: null,
      max_team_members: 5,
      file_upload_size_mb: 20,
      support_level: 'priority_email',
      remove_branding: true,
      white_label: false,
      features: ['advanced_analytics', 'webhooks', 'ab_testing', 'priority_email_support']
    },
    business: {
      tier: 'business',
      name: 'Business',
      price_monthly: 9900,
      price_yearly: 99000,
      monthly_submissions: 100000,
      max_forms: null,
      max_team_members: 25,
      file_upload_size_mb: 100,
      support_level: 'phone',
      remove_branding: true,
      white_label: true,
      features: ['white_label', 'phone_support', 'custom_fields', 'priority_processing']
    },
    enterprise: {
      tier: 'enterprise',
      name: 'Enterprise',
      price_monthly: 19900,
      price_yearly: 199000,
      monthly_submissions: 1000000,
      max_forms: null,
      max_team_members: null,
      file_upload_size_mb: 500,
      support_level: 'dedicated',
      remove_branding: true,
      white_label: true,
      features: ['sso_integration', 'dedicated_support', 'custom_integrations', 'dedicated_infrastructure']
    }
  }
};
