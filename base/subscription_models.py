from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone



class SubscriptionPlan(models.Model):
    """
    Subscription plans with different feature sets and truck limits
    """
    PLAN_CHOICES = [
        ('trial', 'Trial Plan'),
        ('base', 'Base Plan'),
        ('pro', 'Pro Plan'),
        ('unlimited', 'Unlimited Plan'),
    ]
    
    name = models.CharField(max_length=50, choices=PLAN_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    truck_limit = models.IntegerField(help_text="Maximum number of trucks allowed (-1 for unlimited)")
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list, help_text="List of available features")
    is_active = models.BooleanField(default=True)
    is_trial_plan = models.BooleanField(default=False, help_text="Is this a trial plan?")
    trial_duration_days = models.IntegerField(default=14, help_text="Trial duration in days (for trial plans)")
    created_at = models.DateTimeField(default=timezone.now)  # Added default
    updated_at = models.DateTimeField(auto_now=True)  # This already handles updates automatically
    
    class Meta:
        ordering = ['monthly_price']
    
    def __str__(self):
        return self.display_name
    
    def can_create_truck(self, current_truck_count):
        """Check if client can create another truck based on plan limits"""
        if self.truck_limit == -1:  # Unlimited
            return True
        return current_truck_count < self.truck_limit


class ClientSubscription(models.Model):
    """
    Link between Client and their subscription plan
    """
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    PRICING_MODEL_CHOICES = [
        ('total', 'Per Plan'),
        ('per_truck', 'Per Truck'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trial', 'Trial'),
        ('trial_expired', 'Trial Expired'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('pending', 'Pending Payment'),
    ]
    
    client = models.ForeignKey(
        'base.Client',
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES, default='monthly')
    pricing_model = models.CharField(max_length=10, choices=PRICING_MODEL_CHOICES, default='total')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_trial = models.BooleanField(default=False)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Auto-renewal settings
    auto_renew = models.BooleanField(default=True)
    next_billing_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['client'],
                condition=models.Q(status='active'),
                name='unique_active_subscription_per_client'
            )
        ]
    
    def __str__(self):
        return f"{self.client.name} - {self.plan.display_name} ({self.status})"
    
    def clean(self):
        # Ensure only one active subscription per client
        if self.status == 'active':
            existing_active = ClientSubscription.objects.filter(
                client=self.client,
                status='active'
            ).exclude(pk=self.pk)
            
            if existing_active.exists():
                raise ValidationError("Client can only have one active subscription")
        
        # Ensure only one pending subscription per client (for new registrations)
        if self.status == 'pending':
            existing_pending = ClientSubscription.objects.filter(
                client=self.client,
                status='pending'
            ).exclude(pk=self.pk)
            
            if existing_pending.exists():
                raise ValidationError("Client can only have one pending subscription")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.end_date
    
    @property
    def days_remaining(self):
        from django.utils import timezone
        if self.is_expired:
            return 0
        delta = self.end_date - timezone.now()
        return delta.days
    
    def get_current_price(self):
        """Get the current price based on billing cycle"""
        if self.billing_cycle == 'yearly':
            return self.plan.yearly_price
        return self.plan.monthly_price
    
    def can_access_feature(self, feature_name):
        """Check if subscription allows access to a specific feature"""
        return feature_name in self.plan.features
    
    def can_create_truck(self, current_truck_count):
        """Check if client can create another truck based on subscription limits"""
        if self.status not in ['active', 'trial']:
            return False
        return self.plan.can_create_truck(current_truck_count)
    
    @property
    def is_trial_active(self):
        """Check if trial is still active"""
        if not self.is_trial or not self.trial_end_date:
            return False
        return timezone.now() < self.trial_end_date
    
    @property
    def trial_days_remaining(self):
        """Get remaining trial days"""
        if not self.is_trial or not self.trial_end_date:
            return 0
        if not self.is_trial_active:
            return 0
        delta = self.trial_end_date - timezone.now()
        return max(0, delta.days)
    
    def convert_trial_to_paid(self, billing_cycle='monthly'):
        """Convert trial subscription to paid subscription"""
        if not self.is_trial:
            raise ValidationError("This is not a trial subscription")
        
        # Update subscription details
        self.is_trial = False
        self.status = 'active'
        self.billing_cycle = billing_cycle
        
        # Set new end date based on billing cycle
        start_date = timezone.now()
        if billing_cycle == 'yearly':
            from datetime import timedelta
            self.end_date = start_date + timedelta(days=365)
        else:
            from datetime import timedelta
            self.end_date = start_date + timedelta(days=30)
        
        self.next_billing_date = self.end_date
        self.save()
    
    def extend_trial(self, additional_days=7):
        """Extend trial period by additional days"""
        if not self.is_trial or not self.trial_end_date:
            raise ValidationError("This is not a trial subscription")
        
        from datetime import timedelta
        self.trial_end_date = self.trial_end_date + timedelta(days=additional_days)
        self.end_date = self.trial_end_date
        self.save()


class SubscriptionUsage(models.Model):
    """
    Track usage metrics for subscription plans
    """
    subscription = models.ForeignKey(ClientSubscription, on_delete=models.CASCADE, related_name='usage_records')
    date = models.DateField()
    truck_count = models.IntegerField(default=0)
    order_count = models.IntegerField(default=0)
    route_calculations = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['subscription', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.subscription.client.name} - {self.date}"


class SubscriptionPlanChangeRequest(models.Model):
    """
    Track subscription plan change requests that require admin approval
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    client = models.ForeignKey('Client', on_delete=models.CASCADE, related_name='plan_change_requests')
    current_subscription = models.ForeignKey(ClientSubscription, on_delete=models.CASCADE, related_name='change_requests')
    requested_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    billing_cycle = models.CharField(max_length=20, choices=[('monthly', 'Monthly'), ('yearly', 'Yearly')], default='monthly')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(blank=True, help_text="Client's reason for the change request")
    
    # Request details
    requested_by = models.ForeignKey('user.Profile', on_delete=models.CASCADE, related_name='subscription_change_requests')
    requested_at = models.DateTimeField(default=timezone.now)
    
    # Admin decision
    reviewed_by = models.ForeignKey('user.Profile', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_subscription_changes')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, help_text="Admin notes for approval/rejection")
    
    class Meta:
        ordering = ['-requested_at']
        constraints = [
            models.UniqueConstraint(
                fields=['client'],
                condition=models.Q(status='pending'),
                name='unique_pending_request_per_client'
            )
        ]
    
    def clean(self):
        # Ensure only one pending request per client
        if self.status == 'pending':
            existing_pending = SubscriptionPlanChangeRequest.objects.filter(
                client=self.client,
                status='pending'
            ).exclude(id=self.id)
            
            if existing_pending.exists():
                raise ValidationError("Client can only have one pending plan change request")
                
        # Prevent requesting change to the same plan
        if self.current_subscription and self.requested_plan:
            if self.current_subscription.plan.id == self.requested_plan.id:
                raise ValidationError("Cannot request a change to the same plan you are currently on")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def approve(self, admin_user, notes=""):
        """Approve the plan change request and create new subscription"""
        if self.status != 'pending':
            raise ValidationError("Only pending requests can be approved")
        
        # End the current subscription
        self.current_subscription.status = 'cancelled'
        self.current_subscription.end_date = timezone.now()
        self.current_subscription.save()
        
        # Calculate new subscription dates
        start_date = timezone.now()
        if self.billing_cycle == 'yearly':
            from datetime import timedelta
            end_date = start_date + timedelta(days=365)
        else:
            from datetime import timedelta
            end_date = start_date + timedelta(days=30)
        
        # Create new subscription record
        new_subscription = ClientSubscription.objects.create(
            client=self.client,
            plan=self.requested_plan,
            billing_cycle=self.billing_cycle,
            status='active',
            start_date=start_date,
            end_date=end_date,
            is_trial=False,
            auto_renew=self.current_subscription.auto_renew,  # Preserve auto-renew setting
            next_billing_date=end_date
        )
        
        # Update the request status
        self.status = 'approved'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
        
        return new_subscription
    
    def reject(self, admin_user, notes=""):
        """Reject the plan change request"""
        if self.status != 'pending':
            raise ValidationError("Only pending requests can be rejected")
        
        self.status = 'rejected'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def __str__(self):
        return f"{self.client.name} - {self.requested_plan.display_name} ({self.status})"