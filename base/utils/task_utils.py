def compute_task_title(point):
    """
    Computes the task title based on the point data.
    Format: "COUNTRY-POSTAL CITY", skipping any missing parts.
    Examples: "UA-04107 Київ", "UA Київ", "04107 Київ", "Київ".
    """
    if not point:
        return "Unknown Location"

    country = (point.country.short_name if point.country else "").strip().upper()
    postal = (point.postal_code or "").strip()
    city = (point.city or "").strip()

    if country and postal:
        prefix = f"{country}-{postal}"
    elif country:
        prefix = country
    else:
        prefix = postal

    if prefix and city:
        return f"{prefix} {city}"
    return prefix or city or "Unknown Location"
