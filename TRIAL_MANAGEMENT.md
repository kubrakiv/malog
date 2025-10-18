# Trial Version Management System

## Overview

This system provides comprehensive trial management for the Malog TMS application, allowing new clients to try the service before committing to a paid subscription.

## Features

### 1. Trial Subscription Plans

- **Trial Plan**: Free 14-day trial with limited features
- Automatically created in registration process
- Limited to 2 trucks during trial period
- No billing information required

### 2. Registration Integration

- New clients can select trial plan during registration
- Trial automatically starts when client is approved
- Seamless transition to paid plans

### 3. Trial Status Management

- Real-time trial status tracking
- Days remaining calculations
- Automatic expiration handling
- Trial extension capabilities (admin only)

### 4. User Experience Features

- **Trial Status Banner**: Prominent display of remaining trial time
- **Upgrade Modal**: Easy conversion to paid plans
- **Visual Indicators**: Trial badges and highlighting in UI
- **Email Reminders**: Automated notifications before expiration

## Database Structure

### Enhanced SubscriptionPlan Model

```python
- is_trial_plan: Boolean flag for trial plans
- trial_duration_days: Number of trial days (default: 14)
```

### Enhanced ClientSubscription Model

```python
- status: Added 'trial' and 'trial_expired' statuses
- is_trial_active: Property to check active trial status
- trial_days_remaining: Property for remaining days
```

## API Endpoints

### Trial Management

- `POST /api/subscriptions/trial/start/` - Start trial subscription
- `POST /api/subscriptions/trial/convert/` - Convert trial to paid
- `POST /api/subscriptions/trial/extend/` - Extend trial (admin)
- `GET /api/subscriptions/trial/status/` - Get trial status

## Management Commands

### Setup Commands

```bash
# Create default trial plans
python manage.py create_trial_plans

# Approve client and activate trial
python manage.py approve_client <client_id> --activate-users
```

### Maintenance Commands

```bash
# Check and expire overdue trials
python manage.py expire_trials

# Send trial reminder emails
python manage.py send_trial_reminders --days-before 3

# Dry run to see what would happen
python manage.py expire_trials --dry-run
python manage.py send_trial_reminders --dry-run
```

## Frontend Components

### TrialStatusBanner

- Displays trial status in dashboard
- Shows days remaining
- Provides upgrade options
- Responsive design with animations

### Registration Form Enhancements

- Trial plan highlighting with badges
- Free trial messaging
- Visual distinction from paid plans

## Email Notifications

### Automated Reminders

- 3 days before expiration (configurable)
- Professional templates with Ukrainian localization
- Upgrade instructions and benefits
- Contact information for support

### Registration Notifications

- Admin notifications for new registrations
- User confirmation emails
- Approval status updates

## Security & Business Logic

### Access Control

- Trial users have same feature access as plan allows
- Truck limits enforced during trial
- No billing required for trials
- Admin-only trial extensions

### Data Integrity

- One active subscription per client
- Automatic trial expiration
- Status consistency checks
- Transaction-safe operations

## Configuration

### Trial Settings

- Default trial duration: 14 days
- Trial plan truck limit: 2 trucks
- Reminder timing: 3 days before expiration
- Auto-renewal: Disabled for trials

### Email Configuration

Uses existing SMTP configuration from `base.entry_data`:

- Gmail SMTP with STARTTLS
- Ukrainian language templates
- Professional branding

## Best Practices

### For Administrators

1. Run `expire_trials` daily via cron job
2. Send reminders 3 days before expiration
3. Monitor trial conversion rates
4. Approve new registrations promptly

### For Developers

1. Always check trial status before feature access
2. Use provided properties for trial calculations
3. Handle trial expiration gracefully
4. Test trial flows thoroughly

### For Support Teams

1. Use trial extension sparingly
2. Guide users through upgrade process
3. Monitor trial usage patterns
4. Provide upgrade incentives

## Monitoring & Analytics

### Key Metrics to Track

- Trial conversion rates
- Average trial usage
- Most popular upgrade paths
- Trial extension requests
- Support ticket patterns

### Recommended Queries

```sql
-- Trial conversion rate
SELECT
  COUNT(CASE WHEN status = 'cancelled' AND is_trial = true THEN 1 END) as converted,
  COUNT(*) as total_trials
FROM base_clientsubscription
WHERE is_trial = true;

-- Active trials by expiration date
SELECT
  DATE(trial_end_date) as expiry_date,
  COUNT(*) as expiring_count
FROM base_clientsubscription
WHERE status = 'trial'
GROUP BY DATE(trial_end_date)
ORDER BY expiry_date;
```

## Troubleshooting

### Common Issues

1. **Trial not starting**: Check client approval status
2. **Emails not sending**: Verify SMTP configuration
3. **Upgrade failures**: Check plan availability and user permissions
4. **Status inconsistencies**: Run data integrity checks

### Debug Commands

```bash
# Check trial status for specific client
python manage.py shell -c "
from base.subscription_models import ClientSubscription
trial = ClientSubscription.objects.filter(client_id=<ID>, is_trial=True).first()
print(f'Status: {trial.status}, Active: {trial.is_trial_active}, Days: {trial.trial_days_remaining}')
"
```

## Future Enhancements

### Planned Features

- Multi-tier trial plans
- Custom trial durations per client
- A/B testing for trial experiences
- Advanced analytics dashboard
- Integration with payment processors
- Automated follow-up sequences

### Integration Points

- CRM system integration
- Marketing automation
- Analytics platforms
- Customer success tools
