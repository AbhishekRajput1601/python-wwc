
from typing import Optional

_io_instance = None


def set_io(io):
    global _io_instance
    _io_instance = io


def get_io():
    return _io_instance


__all__ = ["set_io", "get_io"]
