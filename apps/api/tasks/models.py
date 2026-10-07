from django.db import models

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

    class Meta:
        ordering = ['deadline']

    def __str__(self)-> str:
        return self.title