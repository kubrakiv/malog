from rest_framework import serializers
from .subscription_models import SubscriptionPlan, ClientSubscription, SubscriptionUsage, SubscriptionPlanChangeRequest


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'display_name', 'description', 'truck_limit',
            'monthly_price', 'yearly_price', 'features', 'is_active',
            'is_trial_plan', 'trial_duration_days'
        ]


class ClientSubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    current_price = serializers.ReadOnlyField(source='get_current_price')
    days_remaining = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = ClientSubscription
        fields = [
            'id', 'plan', 'plan_details', 'billing_cycle', 'pricing_model', 'status',
            'start_date', 'end_date', 'is_trial', 'trial_end_date',
            'auto_renew', 'next_billing_date', 'current_price',
            'days_remaining', 'is_expired'
        ]


class SubscriptionUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionUsage
        fields = [
            'id', 'subscription', 'date', 'truck_count', 'order_count', 
            'route_calculations'
        ]


class SubscriptionPlanChangeRequestSerializer(serializers.ModelSerializer):
    current_plan = SubscriptionPlanSerializer(source='current_subscription.plan', read_only=True)
    requested_plan_details = SubscriptionPlanSerializer(source='requested_plan', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    class Meta:
        model = SubscriptionPlanChangeRequest
        fields = [
            'id', 'client', 'client_name', 'current_subscription', 'current_plan',
            'requested_plan', 'requested_plan_details', 'billing_cycle', 'status',
            'reason', 'requested_by', 'requested_by_name', 'requested_at',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'admin_notes'
        ]
        read_only_fields = ['requested_by', 'requested_at', 'reviewed_by', 'reviewed_at']