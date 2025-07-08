# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:Aleka2002@localhost:5432/meddata_db"

    # --- НАЧАЛО НОВЫХ СТРОК ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # --- КОНЕЦ НОВЫХ СТРОК ---

    class Config:
        env_file = ".env" # Эта строка говорит, откуда брать SECRET_KEY

settings = Settings()