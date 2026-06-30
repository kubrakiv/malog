from django.utils import timezone
from route_calculator.models import FuelPrices
from base.models import CostCenter, TruckUnit, TruckUnitAssignment

EUR_RATES = {'EUR': 1.0, 'UAH': 1 / 42, 'USD': 1 / 1.08, 'CZK': 1 / 25.185, 'PLN': 1 / 4.25}


def compute_order_costs(order):
    """
    Compute full cost breakdown for an order at the current config point in time.
    Returns a dict suitable for storing in order.cost_snapshot.
    """
    client = order.client
    dist = float(order.distance or 0)
    tolls_eur = float(order.tolls or 0)

    # ── Fuel prices ─────────────────────────────────────────────────────────────
    fuel_prices = (
        FuelPrices.all_objects.filter(client=client, is_current=True).first()
        or FuelPrices.all_objects.filter(client=client).order_by('-effective_date').first()
    )
    fuel_currency = fuel_prices.currency if fuel_prices else 'EUR'
    fuel_to_eur = EUR_RATES.get(fuel_currency, 1.0)
    diesel_price_eur = float(fuel_prices.diesel_price_per_liter) * fuel_to_eur if fuel_prices else 0.0
    adblue_price_eur = float(fuel_prices.adblue_price_per_liter) * fuel_to_eur if fuel_prices else 0.0

    # ── Truck norms ──────────────────────────────────────────────────────────────
    truck = order.truck
    diesel_norm = float(truck.diesel_norm or 0) if truck else 0.0
    adblue_norm = float(truck.adblue_norm or 0) if truck else 0.0
    tire_per_km = float(truck.tire_cost_per_km or 0) if truck else 0.0

    # ── Direct costs ─────────────────────────────────────────────────────────────
    diesel_l = (dist / 100) * diesel_norm
    adblue_l = (dist / 100) * adblue_norm
    diesel_cost_eur = diesel_l * diesel_price_eur
    adblue_eur = adblue_l * adblue_price_eur
    tire_cost_eur = dist * tire_per_km
    direct_cost_eur = diesel_cost_eur + adblue_eur + tire_cost_eur

    # ── Fixed costs (cost centers) ───────────────────────────────────────────────
    unit_settings_map = client.settings.get('unit_settings', {})
    truck_units = list(TruckUnit.objects.all())
    cost_centers = list(CostCenter.objects.filter(client=client, is_active=True))

    # Build per-unit km totals
    unit_km_map = {}
    total_trucks_km = 0
    for unit in truck_units:
        unit_cfg = unit_settings_map.get(str(unit.id), {})
        actual_count = TruckUnitAssignment.objects.filter(
            unit=unit, is_active=True, truck__is_removed=False
        ).count()
        planned = int(unit_cfg.get('planned_trucks', actual_count or 1))
        km = int(unit_cfg.get('assumed_km', 10000))
        unit_km_map[unit.id] = planned * km
        total_trucks_km += planned * km

    total_trucks_km = total_trucks_km or 1

    cost_center_breakdown = []
    fixed_cost_eur = 0.0

    for cc in cost_centers:
        eur_per_month = float(cc.monthly_amount) * EUR_RATES.get(cc.currency, 1 / 42)
        if cc.truck_unit_id:
            divisor = unit_km_map.get(cc.truck_unit_id, 1) or 1
        else:
            divisor = total_trucks_km
        per_km_eur = eur_per_month / divisor
        center_cost_eur = per_km_eur * dist
        fixed_cost_eur += center_cost_eur
        cost_center_breakdown.append({
            'id': cc.id,
            'name': cc.name,
            'truck_unit_id': cc.truck_unit_id,
            'monthly_amount': float(cc.monthly_amount),
            'currency': cc.currency,
            'per_km_eur': round(per_km_eur, 6),
            'cost_eur': round(center_cost_eur, 4),
        })

    # Sort by cost DESC for display
    cost_center_breakdown.sort(key=lambda x: x['cost_eur'], reverse=True)

    total_cost_eur = direct_cost_eur + tolls_eur + fixed_cost_eur

    return {
        'snapshotted_at': timezone.now().isoformat(),
        'dist': dist,
        'config': {
            'fuel_currency': fuel_currency,
            'diesel_price_per_liter': float(fuel_prices.diesel_price_per_liter) if fuel_prices else 0,
            'adblue_price_per_liter': float(fuel_prices.adblue_price_per_liter) if fuel_prices else 0,
            'diesel_norm': diesel_norm,
            'adblue_norm': adblue_norm,
            'tire_per_km': tire_per_km,
        },
        'direct': {
            'diesel_l': round(diesel_l, 2),
            'adblue_l': round(adblue_l, 2),
            'diesel_cost_eur': round(diesel_cost_eur, 4),
            'adblue_eur': round(adblue_eur, 4),
            'tire_cost_eur': round(tire_cost_eur, 4),
            'total_eur': round(direct_cost_eur, 4),
        },
        'tolls_eur': round(tolls_eur, 4),
        'fixed': {
            'cost_centers': cost_center_breakdown,
            'total_eur': round(fixed_cost_eur, 4),
        },
        'total_cost_eur': round(total_cost_eur, 4),
    }


def snapshot_order_costs(order):
    """Compute and persist cost snapshot to the order."""
    order.cost_snapshot = compute_order_costs(order)
    order.cost_snapshot_at = timezone.now()
    order.save(update_fields=['cost_snapshot', 'cost_snapshot_at'])
