from datetime import date, datetime

from django.utils import timezone
from ninja import Schema
from pydantic import EmailStr, Field, field_validator

MIN_REMINDER_MINUTES = 5
MAX_REMINDER_MINUTES = 10080 


class TaskIn(Schema):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    assignee_email: EmailStr
    deadline: datetime
    remind_before_minutes: int = Field(
        default=1440, ge=MIN_REMINDER_MINUTES, le=MAX_REMINDER_MINUTES
    )

    @field_validator("deadline")
    @classmethod
    def deadline_must_be_future(cls, value: datetime) -> datetime:
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.utc)
        if value <= timezone.now():
            raise ValueError("Deadline must be in the future")
        return value


class TaskUpdate(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    assignee_email: EmailStr | None = None
    deadline: datetime | None = None
    remind_before_minutes: int | None = Field(
        default=None, ge=MIN_REMINDER_MINUTES, le=MAX_REMINDER_MINUTES
    )


class TaskOut(Schema):
    id: int
    title: str
    description: str
    assignee_email: str
    deadline: datetime
    status: str
    notification_sent: bool
    remind_before_minutes: int
    remind_at: datetime
    created_at: datetime