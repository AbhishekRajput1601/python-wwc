import smtplib
from email.message import EmailMessage
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(subject: str, recipient: str, body: str) -> bool:
    """Send a simple plaintext email using SMTP configured in settings.

    Returns True on success, False otherwise.
    """
    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    user = settings.SMTP_USER
    password = settings.SMTP_PASS
    sender = settings.EMAIL_FROM or user

    if not (host and port and user and password and sender):
        logger.error("SMTP settings are not fully configured; cannot send email")
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient
    msg.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(msg)

        logger.info(f"Sent email to {recipient}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient}: {e}")
        return False
