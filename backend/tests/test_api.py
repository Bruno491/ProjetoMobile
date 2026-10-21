import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth import get_current_user, hash_password, verify_password
from app.database import DatabaseUnavailableError
from app.main import app
from app.schemas import UserProfile

client = TestClient(app, raise_server_exceptions=False)
OWNER = UserProfile(
    id=1,
    family_id=7,
    family_name="Família Teste",
    name="Responsável",
    email="owner@example.com",
    role="owner",
)
MEMBER = UserProfile(
    id=2,
    family_id=7,
    family_name="Família Teste",
    name="Familiar",
    email="member@example.com",
    role="member",
)


class ShoppingItemsApiTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_current_user] = lambda: OWNER

    def tearDown(self):
        app.dependency_overrides.clear()

    @patch("app.main.repository.get_items", return_value=[])
    def test_get_returns_empty_list_when_database_has_no_records(self, _get_items):
        response = client.get("/api/items")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    @patch(
        "app.main.repository.get_items",
        return_value=[
            {"id": 1, "name": "Arroz", "completed": False},
        ],
    )
    def test_get_returns_database_records(self, _get_items):
        response = client.get("/api/items")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [{"id": 1, "name": "Arroz", "completed": False}],
        )

    @patch(
        "app.main.repository.get_items",
        side_effect=DatabaseUnavailableError,
    )
    def test_database_failure_returns_service_unavailable(self, _get_items):
        response = client.get("/api/items")

        self.assertEqual(response.status_code, 503)
        self.assertIn("SQL Server", response.json()["detail"])

    @patch(
        "app.main.repository.get_items",
        side_effect=RuntimeError("unexpected failure"),
    )
    def test_unexpected_server_failure_returns_internal_error(self, _get_items):
        response = client.get("/api/items")

        self.assertEqual(response.status_code, 500)
        self.assertIn("erro inesperado", response.json()["detail"])

    def test_invalid_item_name_returns_validation_error(self):
        response = client.post("/api/items", json={"name": "   "})

        self.assertEqual(response.status_code, 422)

    def test_items_require_authentication(self):
        app.dependency_overrides.clear()

        response = client.get("/api/items")

        self.assertEqual(response.status_code, 401)

    @patch("app.main.repository.create_item")
    def test_family_owner_can_add_an_item(self, create_item):
        create_item.return_value = {
            "id": 11,
            "name": "Feijão",
            "completed": False,
        }

        response = client.post("/api/items", json={"name": "Feijão"})

        self.assertEqual(response.status_code, 201)
        create_item.assert_called_once_with(OWNER.family_id, "Feijão")

    @patch("app.main.repository.create_item")
    def test_family_member_cannot_change_the_list(self, create_item):
        app.dependency_overrides[get_current_user] = lambda: MEMBER

        response = client.post("/api/items", json={"name": "Feijão"})

        self.assertEqual(response.status_code, 403)
        create_item.assert_not_called()

    def test_password_hash_is_salted_and_verified(self):
        first_hash = hash_password("senha-segura-123")
        second_hash = hash_password("senha-segura-123")

        self.assertNotEqual(first_hash, second_hash)
        self.assertTrue(verify_password("senha-segura-123", first_hash))
        self.assertFalse(verify_password("senha-incorreta", first_hash))


if __name__ == "__main__":
    unittest.main()
