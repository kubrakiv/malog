def parse_route_json(route_data):
    """
    Parses LKW route JSON and returns standardized data for object creation.
    """
    try:
        # Similar parsing logic tailored for LKW platform
        # Ensure the returned dictionary structure matches that of Sovtes
        return {
            "customer_data": { ... },
            "customer_manager_data": { ... },
            "order_data": { ... },
            "route_parts": [ ... ],
        }
    except Exception as e:
        raise ValueError(f"Error parsing LKW JSON: {e}")