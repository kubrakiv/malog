from django.db import models
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.db.utils import IntegrityError
from user.models import DriverProfile
from base.models import Truck, Trailer, TrailerAssignment, DriverAssignment, Order, OrderStatusHistory
import logging
logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Truck)
def handle_trailer_assignment(sender, instance, **kwargs):
    try:
        old_truck = Truck.objects.get(pk=instance.pk)
        previous_trailer = old_truck.trailer
    except Truck.DoesNotExist:
        previous_trailer = None

    new_trailer = instance.trailer

    # If the trailer has changed, update the assignments
    if previous_trailer != new_trailer:
        # Mark the previous TrailerAssignment as inactive
        if previous_trailer:
            previous_assignment = TrailerAssignment.objects.filter(
                truck=instance,
                trailer=previous_trailer,
                is_active=True,
            ).first()
            if previous_assignment:
                previous_assignment.end_date = timezone.now()
                previous_assignment.is_active = False
                previous_assignment.save()


@receiver(post_save, sender=Truck)
def create_trailer_assignment(sender, instance, created, **kwargs):
    if instance.trailer:
        # Create a new TrailerAssignment object for the new trailer
        TrailerAssignment.objects.create(
            truck=instance,
            trailer=instance.trailer,
            start_date=timezone.now(),
            is_active=True,
        )


@receiver(pre_save, sender=Truck)
def handle_driver_assignment(sender, instance, **kwargs):
    try:
        old_truck = Truck.objects.get(pk=instance.pk)
        previous_driver = old_truck.driver
    except Truck.DoesNotExist:
        previous_driver = None

    new_driver = instance.driver

    # If the driver has changed, update the assignments
    if previous_driver != new_driver:
        # Mark the previous DriverAssignment as inactive
        if previous_driver:
            previous_assignment = DriverAssignment.objects.filter(
                truck=instance,
                driver_profile=previous_driver,
                is_active=True,
            ).first()
            if previous_assignment:
                previous_assignment.end_date = timezone.now()
                previous_assignment.is_active = False
                previous_assignment.save()

@receiver(post_save, sender=Truck)
def create_driver_assignment(sender, instance, created, **kwargs):
    if instance.driver:
        # Create a new DriverAssignment object for the new driver
        DriverAssignment.objects.create(
            truck=instance,
            driver_profile=instance.driver,
            start_date=timezone.now(),
            is_active=True,
        )


# @receiver(post_save, sender=Order)
# def update_status_history(sender, instance, created, **kwargs):
#     # Handle the initial OrderStatusHistory creation
#     if created:
#         OrderStatusHistory.objects.create(
#             order=instance,
#             status=instance.current_status,
#         )
#     else:
#         # Fetch the previous state of the order
#         try:
#             previous_instance = Order.objects.get(pk=instance.pk)
#         except Order.DoesNotExist:
#             previous_instance = None

#         # Check if current_status has changed
#         if previous_instance and previous_instance.current_status != instance.current_status:
#             # Mark the current active status history as inactive
#             active_history = instance.status_history.filter(is_active=True).first()
#             if active_history:
#                 active_history.is_active = False
#                 active_history.ended_at = timezone.now()
#                 active_history.save()

#             # Create a new OrderStatusHistory object for the new status
#             OrderStatusHistory.objects.create(
#                 order=instance,
#                 status=instance.current_status,
#             )


# @receiver(post_save, sender=Order)
# def update_status_history(sender, instance, created, **kwargs):
#     if created:
#         logger.info("Order created. Adding initial OrderStatusHistory.")
#         OrderStatusHistory.objects.create(
#             order=instance,
#             status=instance.current_status,
#         )
#     else:
#         try:
#             previous_instance = Order.objects.get(pk=instance.pk)
#         except Order.DoesNotExist:
#             previous_instance = None

#         if previous_instance and previous_instance.current_status != instance.current_status:
#             logger.info("Order status changed. Updating OrderStatusHistory.")
#             active_history = instance.status_history.filter(is_active=True).first()
#             if active_history:
#                 active_history.is_active = False
#                 active_history.ended_at = timezone.now()
#                 active_history.save()

#             OrderStatusHistory.objects.create(
#                 order=instance,
#                 status=instance.current_status,
#             )
#         else:
#             logger.info("No status change detected.")

@receiver(post_save, sender=Order)
def update_status_history(sender, instance, created, **kwargs):
    if created:
        # Handle new orders
        logger.info("Order created. Adding initial OrderStatusHistory.")
        OrderStatusHistory.objects.create(
            order=instance,
            status=instance.current_status,
            started_at=timezone.now(),  # Set the started_at time
        )
    else:
        # Fetch the current active status history
        active_history = instance.status_history.filter(is_active=True).first()

        # Only update history if the status has changed
        if active_history is None or active_history.status != instance.current_status:
            logger.info("Order status changed. Updating OrderStatusHistory.")

            # Deactivate the current active history
            if active_history:
                active_history.is_active = False
                active_history.ended_at = timezone.now()
                active_history.save()

            # Handle the special case for "paid" status

            if instance.current_status.name == "paid":
                logger.info("Order status is 'paid'. Automatically setting started_at and ended_at.")
                OrderStatusHistory.objects.create(
                    order=instance,
                    status=instance.current_status,
                    started_at=timezone.now(),  # Automatically set started_at
                    ended_at=timezone.now(),    # Automatically set ended_at
                    is_active=True,   # No further statuses will be active
                )
            else:
                # Create a new history entry
                OrderStatusHistory.objects.create(
                    order=instance,
                    status=instance.current_status,
                    started_at=timezone.now(),  # Set the started_at time
                )
        else:
            logger.info("No status change detected.")
