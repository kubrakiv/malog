def compute_task_title(point):
    """
    Computes the task title based on the point data.

    Args:
        point (object): The point object with `country_id`, `postal_code`, and `city` attributes.

    Returns:
        str: The formatted task title, e.g., "IT-20090 Buccinasco".
    """
    if not point:
        return "Unknown Location"
    
    # Extract country short_name or default to "Unknown Country"
    country = point.country.short_name if point.country else "Unknown Country"
    # Extract postal code and city with fallbacks
    postal_code = point.postal_code or "Unknown Postal Code"
    city = point.city or "Unknown City"
    
    # country = getattr(point, "short_name", "Unknown Country")
    # postal_code = getattr(point, "postal_code", "Unknown Postal Code")
    # city = getattr(point, "city", "Unknown City")
    
    return f"{country}-{postal_code} {city}"