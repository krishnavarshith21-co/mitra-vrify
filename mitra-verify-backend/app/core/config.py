
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "mitra-verify-super-secret-jwt-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = "sqlite+aiosqlite:///./mitra_verify.db"
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret"
    
    def __init__(self, **values):
        import os
        super().__init__(**values)
        
        # Read standard DATABASE_URL and translate postgres prefix for asyncpg
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif db_url.startswith("postgresql://"):
                db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            self.DATABASE_URL = db_url
            
        async_db_url = os.getenv("DATABASE_URL_ASYNC")
        if async_db_url:
            self.DATABASE_URL = async_db_url
            
    CORS_ORIGINS: str = "http://localhost:3005,http://127.0.0.1:3005,https://mitraverify.vercel.app,*"
    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
