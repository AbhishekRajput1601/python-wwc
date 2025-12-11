# Celery configuration for background tasks
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "wwc",
    broker=f"redis://localhost:6379/0",
    backend=f"redis://localhost:6379/0"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Import tasks
# from app.workers.tasks import process_recording, transcribe_audio

@celery_app.task
def example_task():
    """Example Celery task."""
    return "Task completed"
