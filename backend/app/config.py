import os
import secrets
import logging
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DB_SERVER = os.getenv("DB_SERVER", r"(localdb)\MSSQLLocalDB")
DB_NAME = os.getenv("DB_NAME", "ProjetoMobile")
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 18 for SQL Server")
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(48)
    logging.getLogger(__name__).warning(
        "SECRET_KEY is not configured; sessions will be invalidated when the API restarts."
    )
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def get_connection_string() -> str:
    def brace(value: str) -> str:
        return "{" + value.replace("}", "}}") + "}"

    return (
        f"DRIVER={brace(ODBC_DRIVER)};"
        f"SERVER={brace(DB_SERVER)};"
        f"DATABASE={brace(DB_NAME)};"
        "Trusted_Connection=yes;"
        "Encrypt=no;"
    )
