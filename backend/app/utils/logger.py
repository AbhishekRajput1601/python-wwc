import logging
from datetime import datetime
from app.core.config import settings

_logger = logging.getLogger("wwc")

def _format(msg: str) -> str:
    return f"[{datetime.utcnow().isoformat()}] - {msg}"


def info(message: str, data: object | None = None) -> None:
    if data is not None:
        _logger.info(_format(message), extra={"data": data})
    else:
        _logger.info(_format(message))


def error(message: str, error: object | None = None) -> None:
    if error is not None:
        _logger.error(_format(message), extra={"error": error})
    else:
        _logger.error(_format(message))


def warn(message: str, data: object | None = None) -> None:
    if data is not None:
        _logger.warning(_format(message), extra={"data": data})
    else:
        _logger.warning(_format(message))


def debug(message: str, data: object | None = None) -> None:
    if settings.DEBUG:
        if data is not None:
            _logger.debug(_format(message), extra={"data": data})
        else:
            _logger.debug(_format(message))


__all__ = ["info", "error", "warn", "debug"]
