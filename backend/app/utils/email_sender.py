import logging
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_smtp(sender: str, subject: str, recipient: str, body: str) -> bool:
    import smtplib

    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    user = settings.SMTP_USER
    password = settings.SMTP_PASS

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

        logger.info(f"Sent email to {recipient} via SMTP: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {recipient}: {e}")
        return False


def _send_via_sendgrid(sender: str, subject: str, recipient: str, body: str) -> bool:
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
    except Exception:
        logger.error("SendGrid package is not installed")
        return False

    api_key = settings.SENDGRID_API_KEY
    if not api_key:
        logger.error("SENDGRID_API_KEY not configured")
        return False

    message = Mail(
        from_email=sender,
        to_emails=recipient,
        subject=subject,
        plain_text_content=body,
    )

    try:
        client = SendGridAPIClient(api_key)
        resp = client.send(message)
        if 200 <= resp.status_code < 300:
            logger.info(f"Sent email to {recipient} via SendGrid: {subject}")
            return True
        else:
            logger.error(f"SendGrid send failed: {resp.status_code} {resp.body}")
            return False
    except Exception as e:
        logger.error(f"Failed to send email via SendGrid to {recipient}: {e}")
        return False


def send_email(subject: str, recipient: str, body: str) -> bool:
    """Send a simple plaintext email.

    If `SENDGRID_API_KEY` is configured, use SendGrid API (recommended on Render).
    Otherwise fall back to SMTP using configured SMTP settings.
    Returns True on success, False otherwise.
    """
    sender = settings.EMAIL_FROM or settings.SMTP_USER

    # Prefer SendGrid when an API key is provided (Render blocks SMTP outbound ports)
    if getattr(settings, "SENDGRID_API_KEY", None):
        return _send_via_sendgrid(sender, subject, recipient, body)

    return _send_via_smtp(sender, subject, recipient, body)
