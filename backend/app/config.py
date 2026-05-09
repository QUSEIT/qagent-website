from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    server_port: int = 8000
    database_url: str = "sqlite:///./data/qagent.db"
    jwt_secret: str = "change-me-in-production"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    clawmanager_base_url: str = "http://localhost:30332"
    clawmanager_admin_username: str = "admin"
    clawmanager_admin_password: str = "admin123"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
