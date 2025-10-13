# Multi-Tenant Implementation Guide

This document describes the multi-tenant implementation in your Django project using Client-based isolation.

## Overview

The multi-tenant system is based on:

- **Client** as the main tenant entity (entry point)
- **User (Profile)** has a foreign key to Client
- **Company** belongs to Client (one client can have multiple companies)
- Automatic tenant isolation using middleware and custom managers
- Thread-local storage for current client context

## Key Components

### 1. Models

#### Client Model (`base/models.py`)

- Main tenant entity
- Contains: name, slug, is_active, settings (JSONField)
- Entry point for all tenant data

#### BaseTenantModel

- Abstract base class for all tenant-scoped models
- Automatically includes client FK, created_at, updated_at
- Auto-assigns current client on save
- Uses TenantManager for automatic filtering

#### Updated Models

- `Company` - inherits from BaseTenantModel
- `Customer` - inherits from BaseTenantModel
- `Truck` - inherits from BaseTenantModel
- `Trailer` - inherits from BaseTenantModel
- `Order` - inherits from BaseTenantModel
- `Profile` (User) - has FK to Client

### 2. Tenant Management (`base/tenant.py`)

#### Thread-local Storage

- `get_current_client()` - get current client from thread-local
- `set_current_client(client)` - set current client
- `clear_current_client()` - clear current client
- `require_client()` - get client or raise exception

#### Context Manager

- `TenantContext(client)` - temporarily switch client context

### 3. Managers (`base/managers.py`)

#### TenantManager

- Automatically filters by current client
- `all_clients()` - bypass filtering (for admin)
- `for_client(client)` - filter by specific client

#### TenantRelatedManager

- For models with client through FK relationship
- Example: CustomerManager -> Customer -> Client

### 4. Middleware (`base/middleware.py`)

#### TenantMiddleware

- Sets current client based on authenticated user's client
- Adds `request.client` for easy access in views
- Clears client context after request

### 5. Admin Integration (`base/admin.py`)

#### BaseTenantAdmin

- Filters data by user's client
- Superusers see all clients
- Auto-assigns client on save

#### ClientAdmin

- Manages Client entities
- Slug auto-population

### 6. Utilities (`base/utils.py`)

#### Management Functions

- `create_client_with_admin_user()` - setup new client
- `get_client_statistics()` - client metrics
- `duplicate_data_to_client()` - copy data between clients
- `cleanup_client_data()` - delete client data

### 7. Views (`base/tenant_views.py`)

#### TenantViewMixin

- Auto-filters querysets by current client
- Auto-assigns client on create

#### ViewSets

- `ClientViewSet` - client management
- `CompanyViewSet` - tenant-aware company views
- `CustomerViewSet` - tenant-aware customer views
- etc.

## Configuration

### Settings (`backend/settings.py`)

```python
MIDDLEWARE = [
    # ... other middleware
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "base.middleware.TenantMiddleware",  # After authentication
    # ... other middleware
]

AUTH_USER_MODEL = "user.Profile"  # Already configured
```

## Usage Examples

### Creating a Client

```python
# Using management command
python manage.py create_client "Acme Corp" admin admin@acme.com --superuser

# Using utility function
from base.utils import create_client_with_admin_user
client, user = create_client_with_admin_user(
    client_name="Acme Corp",
    username="admin",
    email="admin@acme.com",
    password="securepassword"
)
```

### Working with Tenant Context

```python
from base.tenant import TenantContext
from base.models import Order, Client

client = Client.objects.get(slug="acme-corp")

# Switch context temporarily
with TenantContext(client):
    orders = Order.objects.all()  # Only Acme Corp orders
    new_order = Order.objects.create(...)  # Auto-assigned to Acme Corp
```

### API Usage

```python
# In views, client is automatically set from authenticated user
class OrderViewSet(TenantViewMixin, viewsets.ModelViewSet):
    queryset = Order.objects.all()  # Auto-filtered by client

    def perform_create(self, serializer):
        # Client auto-assigned by TenantViewMixin
        serializer.save()
```

## Migration Process

### 1. Create Migrations

```bash
python manage.py makemigrations
```

### 2. Handle Data Migration

You'll need to create a data migration to:

- Create initial Client(s)
- Assign existing Company records to Client(s)
- Assign existing User records to Client(s)
- Handle existing Order, Customer, Truck, Trailer records

### 3. Example Data Migration

```python
# In a data migration file
def assign_existing_data_to_default_client(apps, schema_editor):
    Client = apps.get_model('base', 'Client')
    Company = apps.get_model('base', 'Company')
    Profile = apps.get_model('user', 'Profile')

    # Create default client
    default_client = Client.objects.create(
        name="Default Client",
        slug="default-client"
    )

    # Assign all existing companies to default client
    Company.objects.update(client=default_client)

    # Assign all users to default client
    Profile.objects.update(client=default_client)

    # Handle other tenant models...
```

## Security Considerations

1. **Data Isolation**: Automatic filtering ensures users only see their client's data
2. **Admin Access**: Superusers can access all clients using `all_objects` manager
3. **API Security**: TenantViewMixin enforces tenant boundaries
4. **Context Safety**: Thread-local storage isolates requests

## Testing

Create tests for:

- Tenant isolation (users can't see other clients' data)
- Automatic client assignment
- Context switching
- Admin access controls
- API endpoint security

## Management Commands

### Create Client

```bash
python manage.py create_client "Client Name" username email@example.com
```

### List Clients

```bash
python manage.py list_clients --detailed
```

## Best Practices

1. **Always use BaseTenantModel** for new tenant-scoped models
2. **Use TenantViewMixin** for API views
3. **Test tenant isolation** thoroughly
4. **Use TenantContext** for background tasks
5. **Monitor performance** of tenant queries
6. **Backup data** before migrations

## Troubleshooting

### Common Issues

1. **No client in context**

   - Ensure TenantMiddleware is properly configured
   - Check user has client assigned

2. **Data not filtered**

   - Verify model inherits from BaseTenantModel or uses TenantRelatedManager
   - Check manager usage (objects vs all_objects)

3. **Admin issues**
   - Ensure admin classes inherit from BaseTenantAdmin
   - Check user client assignment
