"""Socket -> user map utilities."""
from typing import Optional

# simple in-memory map: socket_id -> {id, name}
_socket_user_map: dict[str, dict] = {}


def set_socket_user(socket_id: str, user: dict) -> None:
    try:
        _socket_user_map[socket_id] = user
    except Exception:
        # best-effort, ignore failures
        pass


def get_socket_user(socket_id: str) -> Optional[dict]:
    return _socket_user_map.get(socket_id)


def remove_socket_user(socket_id: str) -> None:
    _socket_user_map.pop(socket_id, None)


__all__ = ["set_socket_user", "get_socket_user", "remove_socket_user"]
