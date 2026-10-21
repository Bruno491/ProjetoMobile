import base64
import hashlib
import hmac
import logging
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from . import auth_repository
from .config import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY
from .schemas import UserProfile

logger = logging.getLogger(__name__)
PASSWORD_ITERATIONS = 600_000
TOKEN_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRE_MINUTES * 60
TOKEN_SERIALIZER = URLSafeTimedSerializer(SECRET_KEY, salt="projetomobile-auth")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_ITERATIONS,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt_text, digest_text = encoded_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_text)
        if iterations < 100_000 or iterations > 2_000_000:
            return False
        salt = base64.urlsafe_b64decode(salt_text.encode("ascii"))
        expected_digest = base64.urlsafe_b64decode(digest_text.encode("ascii"))
        actual_digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, iterations
        )
        return hmac.compare_digest(actual_digest, expected_digest)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int) -> str:
    return TOKEN_SERIALIZER.dumps({"user_id": user_id})


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserProfile:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Faça login para continuar.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = TOKEN_SERIALIZER.loads(
            credentials.credentials, max_age=TOKEN_MAX_AGE_SECONDS
        )
        user_id = int(payload["user_id"])
    except (BadSignature, SignatureExpired, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sua sessão expirou. Entre novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    try:
        user = auth_repository.get_user_by_id(user_id)
    except Exception:
        logger.exception("Could not validate the authenticated user")
        raise
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Esta conta não está mais disponível. Entre novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
