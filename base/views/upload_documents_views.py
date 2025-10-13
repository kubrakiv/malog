from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import (
    Order,
    FileType,
    OrderFile
)
from base.serializers import (
    TaskSerializer,
    OrderFileSerializer,
)

# ORDER FILES VIEWS


@api_view(["GET"])
def getDocument(request, pk):
  try:
    order_file = OrderFile.objects.get(pk=pk)
    serializer = OrderFileSerializer(order_file, many=False)
    return Response(serializer.data)
  except OrderFile.DoesNotExist:
    return Response({"error": 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def getDocuments(request, pk):
  try:
    order_files = OrderFile.objects.filter(order_id=pk)
    serializer = OrderFileSerializer(order_files, many=True)
    
    # documents = [{'file_name': order_file.file.name, 'file_type': order_file.file_type.name, 'uploaded_at': order_file.uploaded_at } for order_file in order_files]
    return Response({'documents': serializer.data}, status=status.HTTP_200_OK)
  except OrderFile.DoesNotExist:
    return Response({"error": 'No documents found for the given order'}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def uploadDocuments(request):
  data = request.data
  print(request.data)

  order_id = int(data.getlist("order_id")[0])
  file_type_name = data.get("file_type")

  print("Order_id: ", order_id)
  print("File Type: ", file_type_name)

  order = Order.objects.filter(pk=order_id).first()
  file_type = FileType.objects.filter(name=file_type_name).first()

  if request.method == "POST":

      documents = request.FILES.getlist('files')
      print("Documents: ", documents)

      for document in documents:
          order_file = OrderFile.objects.create(
            order=order,
            file_type=file_type,
            file=document
          )

      return Response({'message': 'Files uploaded successfully'}, status=status.HTTP_201_CREATED)
  else:
      return Response({'error': 'Only POST method allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["DELETE"])
def deleteDocument(request, pk):
  try:
    order_file = OrderFile.objects.get(pk=pk)
    order_file.delete()
    return Response({'message': 'Document deleted successfully'}, status=status.HTTP_200_OK)
  except OrderFile.DoesNotExist:
    return Response({"error": 'Document not found'}, status=status.HTTP_404_NOT_FOUND)