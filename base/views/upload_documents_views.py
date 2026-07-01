from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import (
    Order,
    FileType,
    OrderFile
)
from base.serializers import (
    OrderFileSerializer,
)

# ORDER FILES VIEWS


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getDocument(request, pk):
  try:
    order_file = OrderFile.objects.get(pk=pk, client=request.user.client)
    serializer = OrderFileSerializer(order_file, many=False, context={'request': request})
    return Response(serializer.data)
  except OrderFile.DoesNotExist:
    return Response({"error": 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getDocuments(request, pk):
  order_files = OrderFile.objects.filter(order_id=pk, client=request.user.client)
  serializer = OrderFileSerializer(order_files, many=True, context={'request': request})

  # documents = [{'file_name': order_file.file.name, 'file_type': order_file.file_type.name, 'uploaded_at': order_file.uploaded_at } for order_file in order_files]
  return Response({'documents': serializer.data}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def uploadDocuments(request):
  data = request.data
  print(request.data)

  order_id_raw = data.get("order_id")
  if not order_id_raw:
    order_id_list = data.getlist("order_id") if hasattr(data, "getlist") else []
    order_id_raw = order_id_list[0] if order_id_list else None

  try:
    order_id = int(order_id_raw)
  except (TypeError, ValueError):
    return Response({'error': 'Invalid order_id'}, status=status.HTTP_400_BAD_REQUEST)

  file_type_name = data.get("file_type")

  print("Order_id: ", order_id)
  print("File Type: ", file_type_name)

  order = Order.objects.filter(pk=order_id, client=request.user.client).first()
  if not order:
    return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

  file_type = FileType.objects.filter(name=file_type_name).first()

  # Fallback to a default type when client sends an unknown/empty file type.
  if not file_type:
    file_type = FileType.objects.filter(name="Інше").first() or FileType.objects.first()

  documents = request.FILES.getlist('files')
  if not documents:
    return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)

  print("Documents: ", documents)

  with transaction.atomic():
    for document in documents:
      OrderFile.objects.create(
        order=order,
        file_type=file_type,
        file=document,
        client=request.user.client,
      )

  return Response({'message': 'Files uploaded successfully'}, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteDocument(request, pk):
  try:
    order_file = OrderFile.objects.get(pk=pk, client=request.user.client)
    order_file.delete()
    return Response({'message': 'Document deleted successfully'}, status=status.HTTP_200_OK)
  except OrderFile.DoesNotExist:
    return Response({"error": 'Document not found'}, status=status.HTTP_404_NOT_FOUND)