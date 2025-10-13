from django.db import models


class OrderIdField(models.CharField):
    description = "A field for storing order id"

    pass
