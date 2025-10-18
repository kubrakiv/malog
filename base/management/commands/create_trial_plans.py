from django.core.management.base import BaseCommand
from base.subscription_models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Create default trial subscription plans'

    def handle(self, *args, **options):
        # Create trial plan
        trial_plan, created = SubscriptionPlan.objects.get_or_create(
            name='trial',
            defaults={
                'display_name': 'Free Trial',
                'description': 'Try our service free for 14 days with limited features',
                'truck_limit': 2,  # Limited trucks for trial
                'monthly_price': 0.00,
                'yearly_price': 0.00,
                'features': [
                    'basic_order_management',
                    'basic_route_planning',
                    'limited_reporting'
                ],
                'is_active': True,
                'is_trial_plan': True,
                'trial_duration_days': 14,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created trial plan: {trial_plan.display_name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Trial plan already exists: {trial_plan.display_name}')
            )

        # Update existing plans to ensure they're not trial plans
        non_trial_plans = ['base', 'pro', 'unlimited']
        for plan_name in non_trial_plans:
            try:
                plan = SubscriptionPlan.objects.get(name=plan_name)
                if plan.is_trial_plan:
                    plan.is_trial_plan = False
                    plan.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'Updated {plan.display_name} - removed trial flag')
                    )
            except SubscriptionPlan.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Plan {plan_name} does not exist')
                )

        self.stdout.write(
            self.style.SUCCESS('Trial plans setup completed!')
        )