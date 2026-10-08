from ninja import NinjaAPI

from tasks.api import router as tasks_router

api=NinjaAPI(title="Tasklist API", version="1.0.0")
api.add_router("/tasks", tasks_router)
