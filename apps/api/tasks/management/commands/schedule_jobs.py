import os
from datetime import datetime, timezone

import django_rq
from django.core.management.base import BaseCommand

from tasks.jobs import check_approaching_deadlines

JOB_PATH="tasks.jobs.check_approaching_deadlines"

class Command(BaseCommand):
    help = "Register the recurring deadline check- safe to run on every start"

    def handle(self, *args, **options):
        scheduler = django_rq.get_scheduler("default")
        # Remove any existing jobs with the same function path
        for job in scheduler.get_jobs():
            if job.func_name == JOB_PATH:
                scheduler.cancel(job)
        interval=int(os.environ.get("DEADLINE_CHECK_INTERVAL", 60))
        # Schedule the new job
        scheduler.schedule(
            scheduled_time=datetime.now(timezone.utc),
            func=check_approaching_deadlines,
            interval=interval,
            repeat=None,
        )
        self.stdout.write(self.style.SUCCESS(f"Scheduled deadline check every {interval} seconds."))