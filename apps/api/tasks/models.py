from django.db import models
from django.utils import timezone
from datetime import timedelta

class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assignee_email = models.EmailField()
    deadline = models.DateTimeField()
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )
    notification_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    remind_before_minutes=models.PositiveIntegerField(default=180)
    remind_at=models.DateTimeField(db_index=True, default=timezone.now, editable=False)


    class Meta:
        ordering = ['deadline']


    def save(self, *args, **kwargs):
    # remind_at is always derived, so it can never drift out of sync
        self.remind_at = self.deadline - timedelta(minutes=self.remind_before_minutes)
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = list(set(update_fields) | {"remind_at"})
        super().save(*args, **kwargs)

    def __str__(self)-> str:
        return self.title