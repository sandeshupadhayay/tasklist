import django_rq

from django.db import transaction
from django.shortcuts import get_object_or_404
from ninja import Router

from .jobs import  send_task_completed_email
from. models import Task
from .schemas import TaskOut, taskIn, Taskupdate

router = Router(tags=["Tasks"])

@router.post("",response={201:TaskOut})
def create_task(request, payload: taskIn):
    task = Task.objects.create(**payload.dict())
    return 201, task

@router.get("",response=list[TaskOut])
def list_tasks(request):
    tasks = Task.objects.all()
    return tasks

@router.get("/{task_id}",response=TaskOut)
def get_task(request, task_id: int):
    task = get_object_or_404(Task, id=task_id)
    return task 

@router.patch("/{task_id}",response=TaskOut)
def update_task(request, task_id: int, payload: Taskupdate):
    task = get_object_or_404(Task, id=task_id)
    changes=payload.dict(exclude_unset=True)
    if "deadline" in changes:
        task.notification_sent = False
    for field, value in changes.items():
        setattr(task, field, value)
    task.save()
    return task


@router.delete("/{task_id}",response={204: None})
def delete_task(request, task_id: int):
    get_object_or_404(Task, id=task_id).delete()
    return 204,None

@router.patch("/{task_id}/complete", response=TaskOut)
def complete_task(request, task_id: int):
    task = get_object_or_404(Task, id=task_id)
    if task.status != Task.Status.COMPLETED:
        task.status = Task.Status.COMPLETED
        task.save(update_fields=["status"])
        transaction.on_commit(
            lambda: django_rq.enqueue(send_task_completed_email, task.id)
        )
    return task
