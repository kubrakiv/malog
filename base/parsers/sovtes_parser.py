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
from datetime import date, datetime, timedelta


INVALID_SOVTES_DATES = {"", None, "0000-00-00"}
INVALID_SOVTES_TIMES = {"", None}


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


def _clean_sovtes_date(value):
    if value in INVALID_SOVTES_DATES:
        return None
    return value


def _clean_sovtes_time(value):
    if value in INVALID_SOVTES_TIMES:
        return None
    return value


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _format_date(value):
    if isinstance(value, date):
        return value.isoformat()
    return value


def _fill_missing_routepart_dates(route_parts):
    """
    Sovtes customs/border routeparts often arrive without explicit dates
    (0000-00-00). Give them an estimated date between neighbouring dated
    routeparts so they remain visible in chronological views and the planner.
    """
    dated = [
        (idx, _parse_date(part.get("date")))
        for idx, part in enumerate(route_parts)
        if _parse_date(part.get("date"))
    ]
    if not dated:
        return route_parts

    for idx, part in enumerate(route_parts):
        if _parse_date(part.get("date")):
            continue

        previous = next(((i, d) for i, d in reversed(dated) if i < idx), None)
        following = next(((i, d) for i, d in dated if i > idx), None)

        if previous and following:
            prev_idx, prev_date = previous
            next_idx, next_date = following
            span_days = max((next_date - prev_date).days, 0)
            span_parts = max(next_idx - prev_idx, 1)
            offset = round(span_days * ((idx - prev_idx) / span_parts))
            part["date"] = _format_date(prev_date + timedelta(days=offset))
        elif previous:
            part["date"] = _format_date(previous[1])
        elif following:
            part["date"] = _format_date(following[1])

    return route_parts


def _extract_assignment(route_data):
    """
    Pull the assigned truck plates + driver identifiers off a Sovtes singleRoute
    payload. The accepted carrier response lives at route["response"][<id>],
    keyed by route["routeresponse"]; fall back to the first response present
    if that key is missing (e.g. response dict has a single entry).
    """
    responses = route_data.get("response")
    if not isinstance(responses, dict) or not responses:
        return None, None, None

    key = route_data.get("routeresponse")
    resp = responses.get(str(key)) if key is not None else None
    if resp is None:
        resp = next(iter(responses.values()), None)
    if not isinstance(resp, dict):
        return None, None, None

    car = resp.get("car") or {}
    driver = resp.get("driver") or {}

    truck_plates = car.get("number") or None
    driver_name = " ".join(
        part for part in (driver.get("firstname"), driver.get("lastname")) if part
    ).strip() or None
    raw_driver_id = driver.get("id")
    driver_sovtes_id = str(raw_driver_id).strip() if raw_driver_id not in (None, "") else None

    return truck_plates, driver_name, driver_sovtes_id


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
        truck_plates, driver_name, driver_sovtes_id = _extract_assignment(route_data)
        order_data = {
            "order_number": route_data.get("periodic", "Unknown Order"),
            "tender_parent": route_data.get("tenderparent") or "",
            "price": route_data.get("budget", 0.0),
            "distance": route_data.get("distance", 0),
            "cargo_name": (route_data.get("routeparts") or [{}])[0].get("cargo", ""),
            "cargo_weight": route_data.get("totalweight", 0),
            "payment_type_id": payment_type.get("id"),
            "trailer_type": cartype[0] if isinstance(cartype, list) and cartype else "Unknown",
            # defaultcurrency can be null in the API response
            "currency": (route_data.get("defaultcurrency") or "UAH").upper(),
            "vat": route_data.get("nds", False),
            # Already-assigned vehicle on the tender, if any — see _extract_assignment
            "truck_plates": truck_plates,
            "driver_name": driver_name,
            "driver_sovtes_id": driver_sovtes_id,
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
                "workaction_title": (part.get("workaction_data") or {}).get("title"),
                "workaction_title_ua": (part.get("workaction_data") or {}).get("title_ua"),
                "date": _clean_sovtes_date(part.get("date1")),
                "time": _clean_sovtes_time(part.get("time1")),
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

        route_parts = _fill_missing_routepart_dates(route_parts)

        return {
            "customer_data": customer_data,
            "customer_manager_data": customer_manager_data,
            "order_data": order_data,
            "route_parts": route_parts,
        }
    except Exception as e:
        raise ValueError(f"Error parsing Sovtes JSON: {e}")
