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


import re


def _split_town_title(title_ru):
    """
    Split a Sovtes town title like '04107 Київ' into (postal, city).
    When there is no numeric prefix the postal is returned as ''.
    """
    if not title_ru:
        return "", ""
    m = re.match(r'^(\d{4,6})\s+(.+)$', title_ru.strip())
    if m:
        return m.group(1), m.group(2)
    return "", title_ru.strip()


def _extract_assignment(route_data):
    """
    Pull the assigned truck plates + driver full name off a Sovtes singleRoute
    payload. The accepted carrier response lives at route["response"][<id>],
    keyed by route["routeresponse"]; fall back to the first response present
    if that key is missing (e.g. response dict has a single entry).
    """
    responses = route_data.get("response")
    if not isinstance(responses, dict) or not responses:
        return None, None

    key = route_data.get("routeresponse")
    resp = responses.get(str(key)) if key is not None else None
    if resp is None:
        resp = next(iter(responses.values()), None)
    if not isinstance(resp, dict):
        return None, None

    car = resp.get("car") or {}
    driver = resp.get("driver") or {}

    truck_plates = car.get("number") or None
    driver_name = " ".join(
        part for part in (driver.get("firstname"), driver.get("lastname")) if part
    ).strip() or None

    return truck_plates, driver_name


def parse_route_json(route_data):
    """
    Parses Sovtes route JSON and returns standardized data for object creation.
    """
    try:
        # Extract customer data
        payor = route_data.get("payorcompany") or {}
        customer_data = {
            "name": payor.get("title", ""),
            "nip_number": payor.get("natcomid", ""),
            "email": (route_data.get("userclientdata") or {}).get("email", ""),
        }

        # Extract customer manager data
        manager_data = route_data.get("userclientdata") or {}
        customer_manager_data = {
            "full_name": manager_data.get("name", ""),
            "phone": manager_data.get("cellnum", ""),
            "email": manager_data.get("email", ""),
        }

        # Extract order data
        payment_type = route_data.get("paymenttype") or {}
        cartype = route_data.get("cartype")
        truck_plates, driver_name = _extract_assignment(route_data)
        order_data = {
            "order_number": route_data.get("periodic", "Unknown Order"),
            "price": route_data.get("budget", 0.0),
            "distance": route_data.get("distance", 0),
            "cargo_name": (route_data.get("routeparts") or [{}])[0].get("cargo", ""),
            "cargo_weight": route_data.get("totalweight", 0),
            "payment_type_id": payment_type.get("id"),
            "trailer_type": cartype[0] if isinstance(cartype, list) and cartype else "Unknown",
            # defaultcurrency can be null in the API response
            "currency": (route_data.get("defaultcurrency") or "EUR").upper(),
            "vat": route_data.get("nds", False),
            # Already-assigned vehicle on the tender, if any — see _extract_assignment
            "truck_plates": truck_plates,
            "driver_name": driver_name,
        }

        # Extract points and tasks
        route_parts_data = route_data.get("routeparts")
        if not isinstance(route_parts_data, list):
            route_parts_data = []

        route_parts = []
        for part in route_parts_data:
            checkpoint = part.get("checkpoint") or {}
            town = checkpoint.get("town") or {}
            country_obj = town.get("country") if isinstance(town.get("country"), dict) else {}

            # Postal code: prefer checkpoint.zip object, fall back to numeric prefix in town.title_ru
            zip_obj = checkpoint.get("zip")
            if isinstance(zip_obj, dict):
                postal_code = zip_obj.get("zip", "") or ""
            else:
                postal_code = ""

            town_postal, city = _split_town_title(town.get("title_ru", ""))
            if not postal_code:
                postal_code = town_postal

            company_obj = checkpoint.get("company") if isinstance(checkpoint.get("company"), dict) else {}

            route_parts.append({
                "id": part.get("id"),
                "workaction": part.get("workaction"),
                "date": part.get("date1"),
                "time": part.get("time1"),
                "point_data": {
                    "country_short_name": country_obj.get("domainname", ""),
                    "city": city,
                    "postal_code": postal_code,
                    "street": checkpoint.get("address", ""),
                    "latitude": checkpoint.get("latit", "0.0"),
                    "longitude": checkpoint.get("longit", "0.0"),
                    "company_name": company_obj.get("title_ru", "") or "",
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
