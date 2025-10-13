

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.models import Customer, CustomerManager, Point, Task, Order, Country, PointCompany, Currency
from base.utils.api_utils import get_api_token
from base.utils.task_utils import compute_task_title
import requests

BASE_URL = "https://sovtes.ua"

@api_view(["GET"])
def fetch_and_create_orders(request, route_id):
    try:
        # Step 1: Get the API token
        token = get_api_token()

        # Step 2: Fetch route data
        headers = {"Authorization": f"{token}", "Language": "en"}
        route_url = f"{BASE_URL}/a/v2/rest/public/singleRoute?route={route_id}"
        
        response = requests.get(route_url, headers=headers)
        route_response = response.json()
        print("TOKEN FROM DB", route_response)

        # Step 3: Check if the token is invalid and refresh if necessary
        if route_response.get("status") == "error" and route_response.get("message") == "Token is invalid":
            # Refresh the token
            token = get_api_token(force_refresh=True)
            headers = {"Authorization": f"{token}", "Language": "en"}
            response = requests.get(route_url, headers=headers)
            route_response = response.json()
            print("NEW TOKEN", route_response)


        if route_response.get("status") != "success":
            return Response({"error": "Failed to fetch route data"}, status=400)

        route_data = route_response["data"]["route"]
        print("ROUTE DATA", route_data)

        # Step 4: Process route data and create models
        added_orders = []
        
        # Create or update the customer
        payor = route_data["payorcompany"]
        customer, _ = Customer.objects.get_or_create(
            name=payor["title"],
            defaults={
                "nip_number": payor["natcomid"],
                "vat_number": None,
                "email": route_data["userclientdata"]["email"],
                "post_address": None,
            },
        )

        # Create or update the customer manager
        manager_data = route_data["userclientdata"]
        manager, _ = CustomerManager.objects.get_or_create(
            full_name=manager_data["name"],
            defaults={
                "phone": manager_data["cellnum"],
                "email": manager_data["email"],
                "customer": customer,
            },
        )

        try:
            currency_short_name = route_data.get("defaultcurrency", "").upper()  # Convert to uppercase
            currency = Currency.objects.filter(short_name=currency_short_name).first()
            if not currency:
                # Fallback to a default currency
                currency = Currency.objects.get(short_name="EUR")
            trailer_type = route_data.get("cartype", ["Unknown"])[0]
            order = Order.objects.create(
                order_number=route_data.get("periodic", "Unknown Order"),
                price=route_data.get("budget", 0.0),
                customer=customer,
                customer_manager=manager,
                rout=route_data.get("periodic", ""),
                distance=route_data.get("distance", 0),
                cargo_name=route_data["routeparts"][0].get("cargo", ""),
                cargo_weight=route_data.get("totalweight", 0),
                payment_type_id=route_data.get("paymenttype", {}).get("id", None),
                trailer_type=trailer_type,
                loading_type=route_data.get("chargetype", ""),
                platform_id=7,  # Sovtes platform ID
                user_id=3,  # default user ID
                vat=route_data.get("nds", False),
                currency_id=currency.id,
            )

            added_orders.append(order.number)
        except Exception as e:
            print("ERROR CREATING ORDER", e)
            return Response({"error": f"Error creating order: {str(e)}"}, status=500)


        # Parse route parts to create points and tasks
        route_parts = route_data["routeparts"]
        for part in route_parts:
            checkpoint = part["checkpoint"]
            town = checkpoint["town"]
            
            print("CHECKPOINT DATA", checkpoint)
            print("TOWN DATA", town)

            try:
                # Find the country instance based on the domainname
                country = Country.objects.filter(short_name=town.get("country", {}).get("domainname")).first()
                company_name=checkpoint.get("company", {}).get("title_ru")
                print("-----------------")
                print("COMPANY NAME", company_name)
                print("-----------------")
                company, created = PointCompany.objects.get_or_create(name=company_name)
                if not country:
                    raise Exception(f"Country with short name '{town.get('country', {}).get('domainname')}' not found.")
                point, _ = Point.objects.get_or_create(
                    country_id=country.id,
                    postal_code=checkpoint.get("zip", {}).get("zip", ""),
                    city=town.get("title_ru", ""),
                    street=checkpoint.get("address", ""),
                    gps_latitude=checkpoint.get("latit", "0.0"),  # Default to "0.0" if missing
                    gps_longitude=checkpoint.get("longit", "0.0"),
                    customer=customer,
                    company_name=company,
                )
            except Exception as e:
                print("ERROR CREATING POINT", e)
                return Response({"error": f"Error creating point: {str(e)}"}, status=500)

            # Create a Task for each point
            try:
                task_type = 1 if part["workaction"] == 1 else 2  # 1 = Loading, 2 = Unloading
                Task.objects.create(
                    title=compute_task_title(point),
                    point=point,
                    start_date=part.get("date1", None),  # Allow `None` if date is missing
                    start_time=part.get("time1", None),
                    truck_id=None,  # Populate this if truck data is available
                    driver_id=None,  # Populate this if driver data is available
                    order=order,
                    type_id=task_type,
                )
            except Exception as e:
                print("ERROR CREATING TASK", e)
                return Response({"error": f"Error creating task: {str(e)}"}, status=500)

        # Create the Order
        print("ORDER DATA", {
            "order_number": route_data["periodic"],
            "price": route_data["budget"],
            "market_price": route_data["budget"],
            "distance": route_data["distance"],
            "cargo_name": route_parts[0].get("cargo", ""),
            "cargo_weight": route_data["totalweight"],
            "payment_type_id": route_data["paymenttype"]["id"],
        })
        
        # Step 5: Return success response
        return Response(
            {
                "message": f"{len(added_orders)} orders created successfully.",
                "orders": added_orders,
            },
            status=201,
        )

    except Exception as e:
        print("GENERAL ERROR", e)
        return Response({"error": str(e)}, status=500)
