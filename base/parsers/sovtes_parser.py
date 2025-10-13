# import json

# def parse_route_json(route_data):
#     print(len(route_data))
#     """
#     Parses Sovtes route JSON and returns standardized data for object creation.
#     """
#     try:
#         # print(json.dumps(route_data, indent=4))  # Debugging
#         # Extract customer data
#         payor = route_data.get("payorcompany", {}) or {}
#         customer_data = {
#             "name": payor.get("title", ""),
#             "nip_number": payor.get("natcomid", ""),
#             "email": route_data.get("userclientdata", {}).get("email", ""),
#         }

#         # Extract customer manager data
#         manager_data = route_data.get("userclientdata", {}) or {}
#         customer_manager_data = {
#             "full_name": manager_data.get("name", ""),
#             "phone": manager_data.get("cellnum", ""),
#             "email": manager_data.get("email", ""),
#         }

#         # Extract order data
#         order_data = {
#             "order_number": route_data.get("periodic", "Unknown Order"),
#             "price": route_data.get("budget", 0.0),
#             "distance": route_data.get("distance", 0),
#             "cargo_name": route_data.get("routeparts", [{}])[0].get("cargo", ""),
#             "cargo_weight": route_data.get("totalweight", 0),
#             "payment_type_id": route_data.get("paymenttype", {}).get("id", None),
#             "trailer_type": route_data.get("cartype", ["Unknown"])[0],
#             "currency": route_data.get("defaultcurrency", "EUR").upper(),
#             "vat": route_data.get("nds", False),
#         }

#         # Extract points and tasks
#         route_parts = []
#         for part in route_data.get("routeparts", []):
#             checkpoint = part.get("checkpoint", {}) or {}
#             town = checkpoint.get("town", {}) or {}
#             route_parts.append({
#                 "id": part.get("id"),
#                 "workaction": part.get("workaction"),
#                 "date": part.get("date1"),
#                 "time": part.get("time1"),
#                 "point_data": {
#                     "country_short_name": town.get("country", {}).get("domainname"),
#                     "city": town.get("title_ru", ""),
#                     "postal_code": checkpoint.get("zip", {}).get("zip", ""),
#                     "street": checkpoint.get("address", ""),
#                     "latitude": checkpoint.get("latit", "0.0"),
#                     "longitude": checkpoint.get("longit", "0.0"),
#                     "company_name": checkpoint.get("company", {}).get("title_ru", "Unknown"),
#                 },
#             })

#         return {
#             "customer_data": customer_data,
#             "customer_manager_data": customer_manager_data,
#             "order_data": order_data,
#             "route_parts": route_parts,
#         }
#     except Exception as e:
#         raise ValueError(f"Error parsing Sovtes JSON: {e}")


import json

def parse_route_json(route_data):
    """
    Parses Sovtes route JSON and returns standardized data for object creation.
    """
    try:
        print(json.dumps(route_data, indent=4))  # Debugging

        # Extract customer data
        payor = route_data.get("payorcompany", {}) or {}
        customer_data = {
            "name": payor.get("title", ""),
            "nip_number": payor.get("natcomid", ""),
            "email": route_data.get("userclientdata", {}).get("email", ""),
        }

        # Extract customer manager data
        manager_data = route_data.get("userclientdata", {}) or {}
        customer_manager_data = {
            "full_name": manager_data.get("name", ""),
            "phone": manager_data.get("cellnum", ""),
            "email": manager_data.get("email", ""),
        }

        # Extract order data
        payment_type = route_data.get("paymenttype") or {}
        order_data = {
            "order_number": route_data.get("periodic", "Unknown Order"),
            "price": route_data.get("budget", 0.0),
            "distance": route_data.get("distance", 0),
            "cargo_name": route_data.get("routeparts", [{}])[0].get("cargo", "") if route_data.get("routeparts") else "",
            "cargo_weight": route_data.get("totalweight", 0),
            "payment_type_id": payment_type.get("id"),
            "trailer_type": route_data.get("cartype", ["Unknown"])[0] if isinstance(route_data.get("cartype"), list) else "Unknown",
            "currency": route_data.get("defaultcurrency", "EUR").upper(),
            "vat": route_data.get("nds", False),
        }

        # Extract points and tasks
        route_parts = []
        route_parts_data = route_data.get("routeparts")
        if not isinstance(route_parts_data, list):
            route_parts_data = []

        for part in route_parts_data:
            checkpoint = part.get("checkpoint") or {}
            town = checkpoint.get("town") or {}
            route_parts.append({
                "id": part.get("id"),
                "workaction": part.get("workaction"),
                "date": part.get("date1"),
                "time": part.get("time1"),
                "point_data": {
                    "country_short_name": town.get("country", {}).get("domainname") if isinstance(town.get("country"), dict) else "",
                    "city": town.get("title_ru", ""),
                    "postal_code": checkpoint.get("zip", {}).get("zip") if isinstance(checkpoint.get("zip"), dict) else "",
                    "street": checkpoint.get("address", ""),
                    "latitude": checkpoint.get("latit", "0.0"),
                    "longitude": checkpoint.get("longit", "0.0"),
                    "company_name": checkpoint.get("company", {}).get("title_ru", "Unknown") if isinstance(checkpoint.get("company"), dict) else "Unknown",
                },
            })

        return {
            "customer_data": customer_data,
            "customer_manager_data": customer_manager_data,
            "order_data": order_data,
            "route_parts": route_parts,
        }
    except Exception as e:
        raise ValueError(f"Error parsing Sovtes JSON: {e}")
