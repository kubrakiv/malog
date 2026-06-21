from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import Company, CompanyBank
from base.serializers import CompanySerializer, CompanyWriteSerializer, CompanyBankWriteSerializer, CompanyBankSerializer


def _require_admin(request):
    return request.user.is_client_admin() or request.user.is_system_admin()


def _get_company(request):
    return Company.objects.filter(client=request.user.client).first()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getCompany(request):
    company = _get_company(request)
    if company:
        return Response(CompanySerializer(company, context={'request': request}).data)
    return Response({"error": "No company found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def updateCompany(request):
    if not _require_admin(request):
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    company = _get_company(request)
    if company:
        serializer = CompanyWriteSerializer(company, data=request.data, partial=True)
    else:
        serializer = CompanyWriteSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    company = serializer.save(client=request.user.client) if not company else serializer.save()
    return Response(CompanySerializer(company, context={'request': request}).data)


# ── Bank accounts ──────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def listCreateBanks(request):
    company = _get_company(request)
    if not company:
        return Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        banks = CompanyBank.objects.filter(company=company)
        return Response(CompanyBankSerializer(banks, many=True).data)

    if not _require_admin(request):
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CompanyBankWriteSerializer(data=request.data)
    if serializer.is_valid():
        bank = serializer.save(company=company, client=request.user.client)
        return Response(CompanyBankSerializer(bank).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def bankDetail(request, bank_id):
    if not _require_admin(request):
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    company = _get_company(request)
    if not company:
        return Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        bank = CompanyBank.objects.get(pk=bank_id, company=company)
    except CompanyBank.DoesNotExist:
        return Response({"error": "Bank not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        bank.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = CompanyBankWriteSerializer(bank, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(CompanyBankSerializer(bank).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
