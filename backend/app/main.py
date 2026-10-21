import logging
import hashlib
import secrets

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import auth_repository, repository
from .auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from .database import DatabaseUnavailableError
from .schemas import (
    FamilyJoin,
    FamilyMember,
    FamilyRegistration,
    InvitationResponse,
    LoginRequest,
    SessionResponse,
    ShoppingItem,
    ShoppingItemCreate,
    ShoppingItemUpdate,
    UserProfile,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ProjetoMobile API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DatabaseUnavailableError)
async def handle_database_unavailable(
    _request: Request, _error: DatabaseUnavailableError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": (
                "Não foi possível acessar o SQL Server. "
                "Verifique se o banco ProjetoMobile foi criado."
            )
        },
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(
    _request: Request, error: Exception
) -> JSONResponse:
    logger.exception("Unexpected API error", exc_info=error)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "O servidor encontrou um erro inesperado."},
    )


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def create_session(user: UserProfile) -> SessionResponse:
    return SessionResponse(
        access_token=create_access_token(user.id),
        user=user,
    )


@app.post(
    "/api/auth/register-family",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_family(data: FamilyRegistration) -> SessionResponse:
    try:
        user = auth_repository.create_family(
            data.family_name,
            data.name,
            data.email,
            hash_password(data.password),
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error
    return create_session(user)


@app.post(
    "/api/auth/join-family",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def join_family(data: FamilyJoin) -> SessionResponse:
    try:
        user = auth_repository.create_member(
            data.name,
            data.email,
            hash_password(data.password),
            data.invite_code,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error
    return create_session(user)


@app.post("/api/auth/login", response_model=SessionResponse)
def login(data: LoginRequest) -> SessionResponse:
    credentials = auth_repository.get_user_by_email(data.email)
    if credentials is None or not verify_password(data.password, credentials[1]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_session(credentials[0])


@app.get("/api/auth/me", response_model=UserProfile)
def read_session(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    return user


@app.get("/api/family/members", response_model=list[FamilyMember])
def read_family_members(
    user: UserProfile = Depends(get_current_user),
) -> list[FamilyMember]:
    return auth_repository.list_members(user.family_id)


@app.post("/api/family/invitations", response_model=InvitationResponse)
def create_family_invitation(
    user: UserProfile = Depends(get_current_user),
) -> InvitationResponse:
    if user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente o responsável pode convidar membros.",
        )
    code = secrets.token_urlsafe(12)
    code_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()
    auth_repository.create_invitation(user.family_id, code_hash)
    return InvitationResponse(code=code)


@app.get("/api/items", response_model=list[ShoppingItem])
def read_items(user: UserProfile = Depends(get_current_user)) -> list[ShoppingItem]:
    return repository.get_items(user.family_id)


@app.post(
    "/api/items",
    response_model=ShoppingItem,
    status_code=status.HTTP_201_CREATED,
)
def add_item(
    item: ShoppingItemCreate,
    user: UserProfile = Depends(get_current_user),
) -> ShoppingItem:
    require_owner(user)
    return repository.create_item(user.family_id, item.name)


@app.patch("/api/items/{item_id}", response_model=ShoppingItem)
def change_item(
    item_id: int,
    item: ShoppingItemUpdate,
    user: UserProfile = Depends(get_current_user),
) -> ShoppingItem:
    require_owner(user)
    updated_item = repository.update_item(
        user.family_id, item_id, item.completed
    )
    if updated_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado.",
        )
    return updated_item


@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(
    item_id: int, user: UserProfile = Depends(get_current_user)
) -> None:
    require_owner(user)
    if not repository.delete_item(user.family_id, item_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado.",
        )


def require_owner(user: UserProfile) -> None:
    if user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente o responsável da família pode alterar a lista.",
        )
