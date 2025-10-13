"""
Utility functions for tenant management
"""
from django.contrib.auth import get_user_model
from ..models import Client
from ..tenant import TenantContext, set_current_client, get_current_client

User = get_user_model()


def create_client_with_admin_user(client_name, username, email, password, **client_kwargs):
    """
    Create a new client with an admin user
    """
    # Create client
    client = Client.objects.create(
        name=client_name,
        slug=client_kwargs.get('slug', client_name.lower().replace(' ', '-')),
        **client_kwargs
    )
    
    # Create admin user for this client
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        client=client
    )
    
    return client, user


def assign_user_to_client(user, client):
    """
    Assign a user to a client
    """
    user.client = client
    user.save()


def switch_user_client(user, new_client):
    """
    Switch a user to a different client (if they have access)
    """
    if user.is_superuser:
        user.client = new_client
        user.save()
        return True
    return False


def get_client_users(client):
    """
    Get all users belonging to a client
    """
    return User.objects.filter(client=client)


def duplicate_data_to_client(source_client, target_client, model_classes=None):
    """
    Utility to duplicate data from one client to another
    Useful for setting up new clients with base data
    """
    from ..models import BaseTenantModel
    
    if model_classes is None:
        # Get all tenant models
        model_classes = [
            model for model in BaseTenantModel.__subclasses__()
        ]
    
    duplicated_objects = {}
    
    with TenantContext(source_client):
        for model_class in model_classes:
            objects_to_duplicate = model_class.objects.all()
            
            with TenantContext(target_client):
                for obj in objects_to_duplicate:
                    # Create a copy
                    obj.pk = None
                    obj.client = target_client
                    obj.save()
                    
                    if model_class not in duplicated_objects:
                        duplicated_objects[model_class] = []
                    duplicated_objects[model_class].append(obj)
    
    return duplicated_objects


def get_client_statistics(client):
    """
    Get statistics for a client
    """
    from ..models import Company, Customer, Truck, Trailer, Order
    
    with TenantContext(client):
        stats = {
            'companies': Company.objects.count(),
            'customers': Customer.objects.count(),
            'trucks': Truck.objects.count(),
            'trailers': Trailer.objects.count(),
            'orders': Order.objects.count(),
            'users': get_client_users(client).count(),
        }
    
    return stats


def cleanup_client_data(client, confirm=False):
    """
    Delete all data for a client (use with caution!)
    """
    if not confirm:
        raise ValueError("Must pass confirm=True to delete client data")
    
    from ..models import BaseTenantModel
    
    # Get all tenant models
    model_classes = [
        model for model in BaseTenantModel.__subclasses__()
    ]
    
    deleted_counts = {}
    
    with TenantContext(client):
        for model_class in model_classes:
            count, _ = model_class.objects.all().delete()
            deleted_counts[model_class.__name__] = count
    
    # Also delete users
    user_count, _ = User.objects.filter(client=client).delete()
    deleted_counts['Users'] = user_count
    
    return deleted_counts