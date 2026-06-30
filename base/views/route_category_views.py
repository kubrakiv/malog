from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import RouteCategory
from base.serializers import RouteCategorySerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listRouteCategories(request):
    categories = RouteCategory.objects.filter(client=request.user.client)
    return Response(RouteCategorySerializer(categories, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def createRouteCategory(request):
    data = request.data
    category = RouteCategory.objects.create(
        client=request.user.client,
        ukr=data["ukr"],
        eng=data.get("eng"),
        is_active=data.get("is_active", True),
    )
    return Response(RouteCategorySerializer(category).data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def routeCategoryDetail(request, pk):
    try:
        category = RouteCategory.objects.get(id=pk, client=request.user.client)
    except RouteCategory.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    data = request.data
    category.ukr = data.get("ukr", category.ukr)
    category.eng = data.get("eng", category.eng)
    category.is_active = data.get("is_active", category.is_active)
    category.save()
    return Response(RouteCategorySerializer(category).data)
