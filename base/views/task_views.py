from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import (
    Task,
    DriverProfile,
    Truck,
    Order,
    TaskType,
    Point,
)
from base.serializers import (
    TaskSerializer,
)

import isoweek


# TASKS VIEWS


# @api_view(["GET"])
# def getTasks(request):
#     tasks = Task.objects.all()
#     serializer = TaskSerializer(tasks, many=True)
#     return Response(serializer.data)

@api_view(["GET"])
def getTasks(request):
    year = request.GET.get("year")
    week = request.GET.get("week")

    if year and week:
        try:
            year = int(year)
            week = int(week)
            # Get the start (Monday) and end (Sunday) of the ISO week
            week_range = isoweek.Week(year, week)
            print("week_range", week_range)
            start_date = week_range.monday()
            end_date = week_range.sunday()
            tasks = Task.objects.filter(start_date__range=[start_date, end_date], client=request.user.client)
        except ValueError:
            return Response({"error": "Invalid year or week"}, status=400)
    else:
        tasks = Task.objects.filter(client=request.user.client)
    
    print("tasks", tasks)
    print("========================")

    serializer = TaskSerializer(tasks, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["GET"])
def getTask(request, pk):
    task = Task.objects.get(id=pk, client=request.user.client)
    serializer = TaskSerializer(task, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
def createTask(request):
    try:
        data = request.data
        print(data)

        driver_name = data.get("driver")
        truck_plate = data.get("truck")
        order_number = data.get("order")
        task_type_name = data.get("type")

        start_time = data.get("start_time")
        if start_time == "":
            start_time = None

        end_time = data.get("end_time")
        if end_time == "":
            end_time = None

        start_date = data.get("start_date")
        if start_date == "":
            start_date = None

        end_date = data.get("end_date")
        if end_date == "":
            end_date = None

        driver = DriverProfile.objects.filter(full_name=driver_name, client=request.user.client).first()
        truck = Truck.objects.filter(plates=truck_plate, client=request.user.client).first()
        task_type = TaskType.objects.filter(name=task_type_name, client=request.user.client).first()
        order = Order.objects.filter(number=order_number, client=request.user.client).first()
        point = Point.objects.filter(id=data.get("point_details", {}).get("id"), client=request.user.client).first()

        task = Task.objects.create(
            title=data.get("title"),
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,
            end_time=end_time,
            truck=truck,
            driver=driver,
            type=task_type,
            order=order,
            point=point,
            client=request.user.client,
        )
        serializer = TaskSerializer(task, many=False, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in createTask: {str(e)}")
        return Response({"error": "Error creating task"}, status=500)


@api_view(["PUT"])
def editTask(request, pk):
    task = Task.objects.get(id=pk, client=request.user.client)
    print(task)
    # Convert empty strings to None for 'end_date' and 'end_time'
    data = request.data.copy()
    if data.get('end_date') == '':
        data['end_date'] = None
    if data.get('end_time') == '':
        data['end_time'] = None
    if data.get('start_time') == '':
        data['start_time'] = None
    if data.get('start_date') == '':
        data['start_date'] = None



    serializer = TaskSerializer(instance=task, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
    else: 
        print(serializer.errors)
        
    print(serializer.data)
    return Response(serializer.data)


@api_view(["DELETE"])
def deleteTask(request, pk):
    try:
        task = Task.objects.get(id=pk, client=request.user.client)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = TaskSerializer(task, many=False, context={'request': request})
    task.delete()

    return Response({"message": "Task deleted successfully", "data": serializer.data})

