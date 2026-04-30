import uvicorn
from app.config import settings
from app.database import engine, Base
from app.models import User  # 注册所有 model

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.server_port, reload=True)
