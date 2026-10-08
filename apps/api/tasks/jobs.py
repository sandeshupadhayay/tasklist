import logging
import django_rq

from datetime import timedelta
from django.utils import timezone
from django.db import transaction

from django.conf import settings
from django.core.mail import send_mail

from .models import Task

logger=logging.getLogger(__name__)

def humanize_minutes(total: int) -> str:
    total = max(int(total), 0)
    days, rest = divmod(total, 1440)
    hours, minutes = divmod(rest, 60)
    parts = []
    if days:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    if minutes or not parts:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    return " ".join(parts[:2])

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


def send_deadline_email(task_id: int) -> None:
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        logger.warning("Task %s no longer exists, skipping deadline email", task_id)
        return

    remaining = int((task.deadline - timezone.now()).total_seconds() // 60)
    _send(
        task,
        subject=f"Reminder: '{task.title}' is due in about {humanize_minutes(remaining)}",
        body=(
            f"Your task '{task.title}' is due at {task.deadline:%Y-%m-%d %H:%M} UTC.\n"
            f"This reminder was set for {humanize_minutes(task.remind_before_minutes)} "
            f"before the deadline.\n\n"
            f"Description: {task.description or 'None'}\n"
        ),
    )
    logger.info("Sent deadline email for task %s", task_id)


def check_approaching_deadlines() -> int:
    """Runs every minute. Enqueues one email per task whose reminder window has opened."""
    now = timezone.now()

    with transaction.atomic():
        tasks = list(
            Task.objects.select_for_update(skip_locked=True)
            .filter(remind_at__lte=now, deadline__gt=now, notification_sent=False)
            .exclude(status=Task.Status.COMPLETED)
        )
        for task in tasks:
            # enqueue first: if Redis is down this raises, the transaction rolls back,
            # and the task is picked up again on the next run
            django_rq.enqueue(send_deadline_email, task.id)
            task.notification_sent = True
            task.save(update_fields=["notification_sent"])

    logger.info("Deadline check enqueued %d email(s)", len(tasks))
    return len(tasks)