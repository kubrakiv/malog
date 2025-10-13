from rest_framework import serializers
from django.db import transaction
from .models import RouteCalculation, RouteToll, RoutePoint, TruckParameters


class RoutePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutePoint
        fields = [
            'country', 'postal_code', 'city', 'address', 'label',
            'date_from', 'date_to', 'lat', 'lng', 'customer',
            'point_type', 'order'
        ]


class RouteTollSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteToll
        fields = ['country', 'currency', 'amount', 'distance_km']


class TruckParametersSerializer(serializers.ModelSerializer):
    class Meta:
        model = TruckParameters
        fields = ['id', 'name', 'weight_capacity', 'truck_type', 'diesel_consumption_per_100km', 'adblue_consumption_per_100km', 'tire_cost_per_km', 'fixed_cost_per_km', 'is_default']


class RouteCalculationSerializer(serializers.ModelSerializer):
    points = RoutePointSerializer(many=True, required=False)
    tolls = RouteTollSerializer(many=True, required=False)
    truck_parameters = TruckParametersSerializer(read_only=True)
    calculated_by = serializers.SerializerMethodField()
    
    class Meta:
        model = RouteCalculation
        fields = [
            'id', 'created_at', 'carrier', 'calculated_by', 'customer',
            'empty_distance_km', 'loaded_distance_km', 'total_duration_h',
            'currency', 'price', 'diesel_cost', 'adblue_cost', 'fuel_cost',
            'tire_cost', 'direct_cost', 'toll_cost', 'fixed_cost',
            'total_cost', 'margin', 'margin_percentage', 'profit', 'profit_percentage',
            'points', 'tolls', 'truck_parameters'
        ]
        read_only_fields = ['id', 'created_at', 'fuel_cost', 'total_cost', 
                          'margin', 'margin_percentage', 'profit', 'profit_percentage']
    
    def get_calculated_by(self, obj):
        if obj.calculated_by:
            return {
                'id': obj.calculated_by.id,
                'username': obj.calculated_by.username,
                'first_name': obj.calculated_by.first_name,
                'last_name': obj.calculated_by.last_name,
                'email': obj.calculated_by.email,
            }
        return None

    def create(self, validated_data):
        points_data = validated_data.pop('points', [])
        tolls_data = validated_data.pop('tolls', [])
        
        route_calculation = RouteCalculation.objects.create(**validated_data)
        
        # Create route points
        for point_data in points_data:
            RoutePoint.objects.create(route=route_calculation, **point_data)
        
        # Create route tolls
        for toll_data in tolls_data:
            RouteToll.objects.create(route=route_calculation, **toll_data)
        
        return route_calculation


class RouteCalculationCreateSerializer(serializers.Serializer):
    """Serializer for creating route calculations from frontend data"""
    carrier = serializers.CharField(max_length=255, required=False, allow_blank=True)
    customer = serializers.CharField(max_length=255, required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    currency = serializers.ChoiceField(choices=RouteCalculation.CURRENCIES, default='EUR')
    truck_parameters_id = serializers.IntegerField(required=False, allow_null=True)
    calculated_by = serializers.IntegerField(required=False, allow_null=True)  # User ID from frontend
    
    # Route data from frontend
    route_info = serializers.DictField()
    points_data = serializers.ListField()
    
    def validate_route_info(self, value):
        """Validate route info structure from frontend"""
        required_fields = ['distance', 'duration', 'emptyDistance', 'tollData']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Missing required field: {field}")
        return value
    
    def validate_points_data(self, value):
        """Validate points data structure from frontend"""
        if len(value) < 2:
            raise serializers.ValidationError("At least 2 points are required")
        
        for point in value:
            required_fields = ['lat', 'lng', 'type', 'label']
            for field in required_fields:
                if field not in point:
                    raise serializers.ValidationError(f"Missing required field in point: {field}")
        return value
    
    def create(self, validated_data):
        route_info = validated_data['route_info']
        points_data = validated_data['points_data']
        
        # Calculate loaded distance (total - empty)
        total_distance = float(route_info['distance'])
        empty_distance = float(route_info['emptyDistance'])
        loaded_distance = total_distance - empty_distance
        
        print(f"Creating route calculation: total={total_distance}, empty={empty_distance}, loaded={loaded_distance}")
        
        with transaction.atomic():
            # Get truck parameters (selected or default)
            truck_params_id = validated_data.get('truck_parameters_id')
            if truck_params_id:
                try:
                    truck_params = TruckParameters.objects.get(id=truck_params_id)
                except TruckParameters.DoesNotExist:
                    truck_params = RouteCalculation.get_default_truck_parameters()
            else:
                truck_params = RouteCalculation.get_default_truck_parameters()
            
            # Create route calculation
            route_calculation = RouteCalculation.objects.create(
                carrier=validated_data.get('carrier'),
                customer=validated_data.get('customer'),
                calculated_by_id=validated_data.get('calculated_by'),  # Use user ID from frontend
                empty_distance_km=empty_distance,
                loaded_distance_km=loaded_distance,
                total_duration_h=float(route_info['duration']),
                currency=validated_data.get('currency', 'EUR'),
                price=validated_data.get('price'),
                toll_cost=float(route_info['tollData']['totalEUR']),
                truck_parameters=truck_params,
            )
            print(f"Created RouteCalculation with ID: {route_calculation.id}")
            
            # Create route points
            print(f"Creating {len(points_data)} route points...")
            for i, point_data in enumerate(points_data):
                country = self._extract_country_from_label(point_data['label'])
                print(f"Point {i}: {point_data['label']} -> {point_data['type'].lower()} in {country}")
                try:
                    # Map frontend types to model choices
                    type_mapping = {
                        'start': 'start',
                        'loading': 'loading', 
                        'unloading': 'unloading'
                    }
                    point_type = type_mapping.get(point_data['type'].lower(), 'start')
                    
                    point = RoutePoint.objects.create(
                        route=route_calculation,
                        lat=point_data['lat'],
                        lng=point_data['lng'],
                        label=point_data['label'],
                        point_type=point_type,
                        order=i,
                        country=country
                    )
                    print(f"Successfully created point {i} with ID: {point.id}")
                except Exception as e:
                    print(f"Error creating point {i}: {e}")
                    raise
            
            # Create route tolls from country data
            if 'countryData' in route_info:
                print(f"Creating {len(route_info['countryData'])} route tolls...")
                for country_data in route_info['countryData']:
                    print(f"Toll: {country_data['country']} - {country_data['toll']} EUR for {country_data['distance']} km")
                    try:
                        toll = RouteToll.objects.create(
                            route=route_calculation,
                            country=country_data['country'],
                            currency='EUR',
                            amount=float(country_data['toll']),
                            distance_km=float(country_data['distance'])
                        )
                        print(f"Successfully created toll for {country_data['country']} with ID: {toll.id}")
                    except Exception as e:
                        print(f"Error creating toll for {country_data['country']}: {e}")
                        raise
            else:
                print("No countryData found in route_info")
            
            print(f"Transaction completed successfully for RouteCalculation ID: {route_calculation.id}")
            return route_calculation
    
    def _extract_country_from_label(self, label):
        """Extract country code from label (e.g., 'Prague CZ' -> 'CZE')"""
        parts = label.split()
        if len(parts) > 1:
            country_code = parts[-1].upper()
            # Convert 2-letter to 3-letter codes
            country_mapping = {
                'CZ': 'CZE', 'DE': 'DEU', 'AT': 'AUT', 'IT': 'ITA',
                'PL': 'POL', 'SK': 'SVK', 'UA': 'UKR', 'FR': 'FRA',
                'NL': 'NLD', 'BE': 'BEL', 'CH': 'CHE', 'HU': 'HUN',
                'RO': 'ROU', 'BG': 'BGR', 'HR': 'HRV', 'SI': 'SVN',
                'LT': 'LTU', 'LV': 'LVA', 'EE': 'EST', 'FI': 'FIN',
                'SE': 'SWE', 'NO': 'NOR', 'DK': 'DNK', 'IE': 'IRL',
                'GB': 'GBR', 'ES': 'ESP', 'PT': 'PRT', 'GR': 'GRC',
                'CY': 'CYP', 'MT': 'MLT', 'LU': 'LUX'
            }
            # Check if it's already a 3-letter code
            if len(country_code) == 3:
                return country_code
            # Convert 2-letter to 3-letter
            return country_mapping.get(country_code, 'UNK')
        
        # If no country code found, try to extract from patterns like "IT-28047 Oleggio"
        if '-' in label:
            parts = label.split('-')
            if len(parts) > 0:
                potential_code = parts[0].upper()
                if len(potential_code) == 2:
                    country_mapping = {
                        'CZ': 'CZE', 'DE': 'DEU', 'AT': 'AUT', 'IT': 'ITA',
                        'PL': 'POL', 'SK': 'SVK', 'UA': 'UKR', 'FR': 'FRA',
                        'NL': 'NLD', 'BE': 'BEL', 'CH': 'CHE', 'HU': 'HUN',
                        'RO': 'ROU', 'BG': 'BGR', 'HR': 'HRV', 'SI': 'SVN',
                        'LT': 'LTU', 'LV': 'LVA', 'EE': 'EST', 'FI': 'FIN',
                        'SE': 'SWE', 'NO': 'NOR', 'DK': 'DNK', 'IE': 'IRL',
                        'GB': 'GBR', 'ES': 'ESP', 'PT': 'PRT', 'GR': 'GRC',
                        'CY': 'CYP', 'MT': 'MLT', 'LU': 'LUX'
                    }
                    return country_mapping.get(potential_code, 'UNK')
        
        return 'UNK'
