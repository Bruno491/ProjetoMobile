from collections.abc import Sequence

from .database import get_connection
from .schemas import ShoppingItem


def _to_item(row: Sequence[object]) -> ShoppingItem:
    return ShoppingItem(id=int(row[0]), name=str(row[1]), completed=bool(row[2]))


def get_items(family_id: int) -> list[ShoppingItem]:
    with get_connection() as connection:
        cursor = connection.cursor()
        rows = cursor.execute(
            """
            SELECT id, name, completed
            FROM dbo.ShoppingItems
            WHERE family_id = ?
            ORDER BY id
            """,
            family_id,
        ).fetchall()
        return [_to_item(row) for row in rows]


def create_item(family_id: int, name: str) -> ShoppingItem:
    with get_connection() as connection:
        cursor = connection.cursor()
        row = cursor.execute(
            """
            INSERT INTO dbo.ShoppingItems (family_id, name, completed)
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.completed
            VALUES (?, ?, 0)
            """,
            family_id,
            name,
        ).fetchone()
        connection.commit()
        return _to_item(row)


def update_item(
    family_id: int, item_id: int, completed: bool
) -> ShoppingItem | None:
    with get_connection() as connection:
        cursor = connection.cursor()
        row = cursor.execute(
            """
            UPDATE dbo.ShoppingItems
            SET completed = ?
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.completed
            WHERE id = ? AND family_id = ?
            """,
            completed,
            item_id,
            family_id,
        ).fetchone()
        if row is None:
            return None
        connection.commit()
        return _to_item(row)


def delete_item(family_id: int, item_id: int) -> bool:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "DELETE FROM dbo.ShoppingItems WHERE id = ? AND family_id = ?",
            item_id,
            family_id,
        )
        deleted = cursor.rowcount > 0
        connection.commit()
        return deleted
