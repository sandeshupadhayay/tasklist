from datetime import datetime

from django.utils import timezone
from ninja import Schema
from pydantic import EmailStr, Field, field_validator

class taskIn(Schema):
    title: str = Field(..., max_length=255)
    description: str | None = None
    assignee_email: EmailStr
    deadline: datetime

    @field_validator("deadline")
    def validate_deadline(cls, value: datetime) -> datetime:
        if timezone.is_naive(value):
            value = timezone.make_aware(value)
        if value <= timezone.now():
            raise ValueError("Deadline must be in the future.")
        return value


class Taskupdate(Schema):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    assignee_email: EmailStr | None = None
    deadline: datetime | None = None

class TaskOut(Schema):
    id: int
    title: str
    description: str | None
    assignee_email: EmailStr
    deadline: datetime
    status: str
    notification_sent: bool
    created_at: datetime