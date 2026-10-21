from typing import Annotated

import re

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

ItemName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=120),
]
ShortName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2, max_length=80),
]
EmailAddress = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=5, max_length=254),
]
Password = Annotated[str, StringConstraints(min_length=8, max_length=128)]


class FamilyRegistration(BaseModel):
    family_name: ShortName
    name: ShortName
    email: EmailAddress
    password: Password

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Informe um e-mail válido.")
        return normalized


class FamilyJoin(BaseModel):
    name: ShortName
    email: EmailAddress
    password: Password
    invite_code: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=64)]

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Informe um e-mail válido.")
        return normalized


class LoginRequest(BaseModel):
    email: EmailAddress
    password: Annotated[str, StringConstraints(min_length=1, max_length=128)]

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserProfile(BaseModel):
    id: int
    family_id: int
    family_name: str
    name: str
    email: str
    role: str


class SessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class FamilyMember(BaseModel):
    id: int
    name: str
    email: str
    role: str


class InvitationResponse(BaseModel):
    code: str
    expires_in_hours: int = 24


class ShoppingItemCreate(BaseModel):
    name: ItemName


class ShoppingItemUpdate(BaseModel):
    completed: bool


class ShoppingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(gt=0)
    name: ItemName
    completed: bool
