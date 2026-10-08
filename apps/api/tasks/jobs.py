import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import Task

logger=logging.getLogger(__name__)

def _send(task: Task, subject: str, body: str):
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[task.assignee_email],
        fail_silently=False,
    )

def send_task_completed_email(task_id: int):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        logger.warning(f"Task %s no longer exists, skipping completed email", task_id)
        return
    _send(
        task,
        subject=f"Task Completed: {task.title}",
        body=(f"The task '{task.title}' has been marked as completed.\n\n"
                f"Description: {task.description or 'None'}\n"
        )
    )


def send_deadline_email(task_id: int)-> None:
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        logger.warning(f"Task %s no longer exists, skipping deadline email", task_id)
        return
    _send(
        task,
        subject=f"Task Deadline Approaching: {task.title}",
        body=(
            f"The task '{task.title}' is due at {task.deadline:%Y-%m-%d %H:%M} UTC.\n\n"
            f"Description: {task.description or 'None'}\n"
        ),
    )
    logger.info("Sent deadline email for task %s", task_id)