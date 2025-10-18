from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from base.subscription_models import ClientSubscription
from user.models import Profile
from django.conf import settings
from base.entry_data import email_sender, gmail_password
from email.message import EmailMessage
import ssl
import smtplib
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send trial reminder emails to clients'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-before',
            type=int,
            default=3,
            help='Send reminder X days before trial expires (default: 3)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what emails would be sent without actually sending them'
        )

    def handle(self, *args, **options):
        days_before = options['days_before']
        dry_run = options['dry_run']
        
        # Calculate the target date (trials expiring in X days)
        target_date = timezone.now() + timedelta(days=days_before)
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Find trials expiring on the target date
        expiring_trials = ClientSubscription.objects.filter(
            status='trial',
            is_trial=True,
            trial_end_date__range=(start_of_day, end_of_day)
        )
        
        if not expiring_trials.exists():
            self.stdout.write(
                self.style.SUCCESS(f'No trials expiring in {days_before} days found')
            )
            return
        
        self.stdout.write(f'Found {expiring_trials.count()} trials expiring in {days_before} days:')
        
        sent_count = 0
        error_count = 0
        
        for trial in expiring_trials:
            try:
                # Get the admin user for this client
                admin_user = Profile.objects.filter(
                    client=trial.client,
                    is_staff=True,
                    is_active=True
                ).first()
                
                if not admin_user:
                    self.stdout.write(
                        self.style.WARNING(f'  No admin user found for {trial.client.name}')
                    )
                    continue
                
                self.stdout.write(f'  - {trial.client.name} ({admin_user.email})')
                
                if not dry_run:
                    success = self.send_trial_reminder_email(trial, admin_user, days_before)
                    if success:
                        sent_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'    ✓ Email sent successfully')
                        )
                    else:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(f'    ✗ Failed to send email')
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'    Would send reminder email (dry run)')
                    )
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'  Error processing {trial.client.name}: {str(e)}')
                )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'\nDry run completed - no emails sent')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nCompleted: {sent_count} emails sent, {error_count} errors')
            )

    def send_trial_reminder_email(self, trial, admin_user, days_before):
        """Send trial reminder email"""
        try:
            subject = f'Ваш тріальний period Malog TMS закінчується через {days_before} днів'
            
            body = f'''
Привіт {admin_user.get_full_name()},

Ваш тріальний період у Malog TMS закінчується через {days_before} днів.

Деталі вашого тріалу:
• Компанія: {trial.client.name}
• План: {trial.plan.display_name}
• Дата закінчення: {trial.trial_end_date.strftime('%d.%m.%Y')}
• Кількість вантажівок: {trial.plan.truck_limit if trial.plan.truck_limit != -1 else 'Необмежено'}

Щоб продовжити користуватися всіма можливостями Malog TMS, оновіть свій план до закінчення тріального періоду.

Переваги оновлення:
✓ Безперервний доступ до всіх функцій
✓ Розширені можливості управління автопарком
✓ Приоритетна підтримка
✓ Додаткове сховище даних

Оновити план можна у налаштуваннях акаунту або зв'язавшись з нашою командою підтримки.

З найкращими побажаннями,
Команда Malog TMS

--
Цей email було надіслано автоматично. Якщо у вас є питання, зв'яжіться з нами.
            '''
            
            # Create email message
            email_message = EmailMessage()
            email_message['From'] = email_sender
            email_message['To'] = admin_user.email
            email_message['Subject'] = subject
            email_message.set_content(body)

            # Send email using SMTP with STARTTLS
            context = ssl.create_default_context()
            with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(email_sender, gmail_password)
                smtp.send_message(email_message)
                
            logger.info(f"Trial reminder email sent to {admin_user.email}")
            return True
            
        except Exception as e:
            logger.error(f'Failed to send trial reminder email to {admin_user.email}: {str(e)}')
            return False