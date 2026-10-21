import logging
from collections.abc import Iterator
from contextlib import contextmanager

import pyodbc

from .config import get_connection_string

logger = logging.getLogger(__name__)


class DatabaseUnavailableError(Exception):
    pass


@contextmanager
def get_connection() -> Iterator[pyodbc.Connection]:
    connection = None
    try:
        connection = pyodbc.connect(get_connection_string(), timeout=5)
        yield connection
    except pyodbc.Error as error:
        logger.exception("SQL Server operation failed")
        raise DatabaseUnavailableError from error
    finally:
        if connection is not None:
            connection.close()
