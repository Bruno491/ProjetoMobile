import hashlib
from collections.abc import Sequence

from .database import get_connection
from .schemas import FamilyMember, UserProfile


def _to_profile(row: Sequence[object]) -> UserProfile:
    return UserProfile(
        id=int(row[0]),
        family_id=int(row[1]),
        family_name=str(row[2]),
        name=str(row[3]),
        email=str(row[4]),
        role=str(row[5]),
    )


def _email_exists(cursor, email: str) -> bool:
    return (
        cursor.execute(
            "SELECT 1 FROM dbo.Users WHERE email = ?",
            email,
        ).fetchone()
        is not None
    )


def create_family(
    family_name: str,
    name: str,
    email: str,
    password_hash: str,
) -> UserProfile:
    with get_connection() as connection:
        cursor = connection.cursor()
        if _email_exists(cursor, email):
            raise ValueError("Este e-mail já está cadastrado.")

        family_count = int(
            cursor.execute("SELECT COUNT(*) FROM dbo.Families").fetchone()[0]
        )
        family_id = int(
            cursor.execute(
                """
                INSERT INTO dbo.Families (name)
                OUTPUT INSERTED.id
                VALUES (?)
                """,
                family_name,
            ).fetchone()[0]
        )
        user_id = int(cursor.execute(
            """
            INSERT INTO dbo.Users (family_id, name, email, password_hash, role)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, N'owner')
            """,
            family_id,
            name,
            email,
            password_hash,
        ).fetchone()[0])
        if family_count == 0:
            cursor.execute(
                "UPDATE dbo.ShoppingItems SET family_id = ? WHERE family_id IS NULL",
                family_id,
            )
        connection.commit()
        return _to_profile(
            cursor.execute(
                """
                SELECT u.id, u.family_id, f.name, u.name, u.email, u.role
                FROM dbo.Users AS u
                INNER JOIN dbo.Families AS f ON f.id = u.family_id
                WHERE u.id = ?
                """,
                user_id,
            ).fetchone()
        )


def get_user_by_email(email: str) -> tuple[UserProfile, str] | None:
    with get_connection() as connection:
        row = connection.cursor().execute(
            """
            SELECT u.id, u.family_id, f.name, u.name, u.email, u.role,
                   u.password_hash
            FROM dbo.Users AS u
            INNER JOIN dbo.Families AS f ON f.id = u.family_id
            WHERE u.email = ?
            """,
            email,
        ).fetchone()
        if row is None:
            return None
        return _to_profile(row[:6]), str(row[6])


def get_user_by_id(user_id: int) -> UserProfile | None:
    with get_connection() as connection:
        row = connection.cursor().execute(
            """
            SELECT u.id, u.family_id, f.name, u.name, u.email, u.role
            FROM dbo.Users AS u
            INNER JOIN dbo.Families AS f ON f.id = u.family_id
            WHERE u.id = ?
            """,
            user_id,
        ).fetchone()
        return _to_profile(row) if row is not None else None


def create_member(
    name: str,
    email: str,
    password_hash: str,
    invite_code: str,
) -> UserProfile:
    code_hash = hashlib.sha256(invite_code.encode("utf-8")).hexdigest()
    with get_connection() as connection:
        cursor = connection.cursor()
        if _email_exists(cursor, email):
            raise ValueError("Este e-mail já está cadastrado.")
        invitation = cursor.execute(
            """
            SELECT TOP 1 id, family_id
            FROM dbo.FamilyInvitations WITH (UPDLOCK, ROWLOCK)
            WHERE code_hash = ?
              AND used_at IS NULL
              AND expires_at > SYSUTCDATETIME()
            """,
            code_hash,
        ).fetchone()
        if invitation is None:
            raise ValueError("O convite é inválido, expirou ou já foi utilizado.")

        user_id = int(cursor.execute(
            """
            INSERT INTO dbo.Users (family_id, name, email, password_hash, role)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, N'member')
            """,
            int(invitation[1]),
            name,
            email,
            password_hash,
        ).fetchone()[0])
        cursor.execute(
            """
            UPDATE dbo.FamilyInvitations
            SET used_at = SYSUTCDATETIME()
            WHERE id = ? AND used_at IS NULL
            """,
            int(invitation[0]),
        )
        row = cursor.execute(
            """
            SELECT u.id, u.family_id, f.name, u.name, u.email, u.role
            FROM dbo.Users AS u
            INNER JOIN dbo.Families AS f ON f.id = u.family_id
            WHERE u.id = ?
            """,
            user_id,
        ).fetchone()
        connection.commit()
        return _to_profile(row)


def list_members(family_id: int) -> list[FamilyMember]:
    with get_connection() as connection:
        rows = connection.cursor().execute(
            """
            SELECT id, name, email, role
            FROM dbo.Users
            WHERE family_id = ?
            ORDER BY CASE WHEN role = N'owner' THEN 0 ELSE 1 END, name
            """,
            family_id,
        ).fetchall()
        return [
            FamilyMember(
                id=int(row[0]),
                name=str(row[1]),
                email=str(row[2]),
                role=str(row[3]),
            )
            for row in rows
        ]


def create_invitation(family_id: int, code_hash: str) -> None:
    with get_connection() as connection:
        connection.cursor().execute(
            """
            INSERT INTO dbo.FamilyInvitations (family_id, code_hash, expires_at)
            VALUES (?, ?, DATEADD(hour, 24, SYSUTCDATETIME()))
            """,
            family_id,
            code_hash,
        )
        connection.commit()
