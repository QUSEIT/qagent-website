import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, qagent

# Force app loggers to INFO so they are visible alongside uvicorn.access
for _logger_name in ("app", "app.routers", "app.routers.qagent", "app.services", "app.services.clawmanager", "app.services.feishu"):
    _logger = logging.getLogger(_logger_name)
    _logger.setLevel(logging.INFO)
    if not _logger.handlers:
        _handler = logging.StreamHandler()
        _handler.setLevel(logging.INFO)
        _handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
        _logger.addHandler(_handler)

init_db()

app = FastAPI(title="Q Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(qagent.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
