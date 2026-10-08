import django_rq

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router

from .jobs import  send_task_completed_email,send_deadline_email
from. models import Task
from .schemas import TaskOut, TaskIn, TaskUpdate

router = Router(tags=["Tasks"])

def _send_now_if_due(task: Task) -> None:
    """If the reminder window is already open, email now instead of waiting for the scheduler."""
    now = timezone.now()
    if task.status != Task.Status.COMPLETED and task.remind_at <= now < task.deadline:
        task.notification_sent = True
        task.save(update_fields=["notification_sent"])
        transaction.on_commit(lambda: django_rq.enqueue(send_deadline_email, task.id))


@router.post("", response={201: TaskOut})
def create_task(request, payload: TaskIn):
    with transaction.atomic():
        task = Task.objects.create(**payload.dict())
        _send_now_if_due(task)
    return 201, task

@router.get("",response=list[TaskOut])
def list_tasks(request):
    tasks = Task.objects.all()
    return tasks

@router.get("/{task_id}",response=TaskOut)
def get_task(request, task_id: int):
    task = get_object_or_404(Task, id=task_id)
    return task 

@router.patch("/{task_id}", response=TaskOut)
def update_task(request, task_id: int, payload: TaskUpdate):
    task = get_object_or_404(Task, id=task_id)
    changes = payload.dict(exclude_unset=True)
    reschedule = "deadline" in changes or "remind_before_minutes" in changes

    with transaction.atomic():
        for field, value in changes.items():
            setattr(task, field, value)
        if reschedule:
            task.notification_sent = False
        task.save()
        if reschedule:
            _send_now_if_due(task)
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
