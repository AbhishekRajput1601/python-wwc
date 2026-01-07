import logging
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_smtp(sender: str, subject: str, recipient: str, body: str, html: Optional[str] = None) -> bool:
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
    if html:
        msg.add_alternative(html, subtype="html")

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


def _send_via_sendgrid(sender: str, subject: str, recipient: str, body: str, html: Optional[str] = None) -> bool:
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
        html_content=html or None,
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


def send_email(subject: str, recipient: str, body: str, html: Optional[str] = None) -> bool:

        sender = settings.EMAIL_FROM or settings.SMTP_USER

        if getattr(settings, "SENDGRID_API_KEY", None):
                return _send_via_sendgrid(sender, subject, recipient, body, html)

        return _send_via_smtp(sender, subject, recipient, body, html)


def build_otp_email(code: str, expires_minutes: int = 5) -> str:
   
        site_name = "WWC"
       
        gradient_start = "#6D5EFE"
        gradient_end = "#8A78FF"
        background = "#0b1020"
        card_bg = "#0f1724"
        text_color = "#d1d5db"

        html = f"""
<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{site_name} - Your OTP Code</title>
        <style>
            body {{ background: {background}; color: {text_color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; padding:20px; }}
            .container {{ max-width:600px; margin:28px auto; }}
            .card {{ background:{card_bg}; border-radius:12px; overflow:hidden; box-shadow:0 4px 30px rgba(0,0,0,0.4); }}
            .header {{ padding:36px 24px; background: linear-gradient(90deg, {gradient_start}, {gradient_end}); text-align:center; }}
            .brand {{ font-size:28px; color:#fff; font-weight:700; margin:0; }}
            .sub {{ color: rgba(255,255,255,0.9); margin-top:6px; font-size:13px; }}
            .body {{ padding:28px 28px 40px; line-height:1.5; color:{text_color}; }}
            .otp-box {{ margin:22px auto; max-width:360px; border-radius:12px; border:2px dashed rgba(139,92,246,0.5); padding:18px; text-align:center; }}
            .otp {{ font-family: 'Courier New', monospace; font-size:36px; letter-spacing:8px; color:#c7d2fe; font-weight:700; }}
            .muted {{ color: rgba(209,213,219,0.9); font-size:14px; }}
            .footer-note {{ padding:18px 24px; text-align:center; color:rgba(255,255,255,0.45); font-size:12px; }}
            @media only screen and (max-width:480px) {{ .otp {{ font-size:28px; letter-spacing:6px; }} .container {{ padding:0 12px; }} }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="header">
                    <div class="brand">{site_name}</div>
                    <div class="sub">Your OTP Code</div>
                </div>
                <div class="body">
                    <p class="muted">Hello,</p>
                    <p class="muted">You requested an OTP code to access your {site_name} account. Please use the code below:</p>

                    <div class="otp-box">
                        <div class="otp">{code}</div>
                    </div>

                    <p class="muted"><strong>This code will expire in {expires_minutes} minutes.</strong></p>
                    <p class="muted">If you didn't request this code, please ignore this email.</p>

                    <p class="muted">Thanks,<br/>{site_name} Team</p>
                </div>
                <div class="footer-note">This is an automated email. Please do not reply.</div>
            </div>
        </div>
    </body>
</html>
"""
        return html


def build_welcome_email(display_name: str, action_url: Optional[str] = None) -> str:

        site_name = "WWC"
        gradient_start = "#6D5EFE"
        gradient_end = "#8A78FF"
        background = "#0b1020"
        card_bg = "#0f1724"
        text_color = "#d1d5db"

        action_html = ""
        if action_url:
                action_html = f"<p style=\"text-align:center;margin-top:18px\"><a href=\"{action_url}\" style=\"background:linear-gradient(90deg,{gradient_start},{gradient_end});color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600\">Get Started</a></p>"

        html = f"""
<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to {site_name}</title>
        <style>
            body {{ background: {background}; color: {text_color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; padding:20px; }}
            .container {{ max-width:600px; margin:28px auto; }}
            .card {{ background:{card_bg}; border-radius:12px; overflow:hidden; box-shadow:0 4px 30px rgba(0,0,0,0.4); }}
            .header {{ padding:36px 24px; background: linear-gradient(90deg, {gradient_start}, {gradient_end}); text-align:center; }}
            .brand {{ font-size:28px; color:#fff; font-weight:700; margin:0; }}
            .sub {{ color: rgba(255,255,255,0.9); margin-top:6px; font-size:13px; }}
            .body {{ padding:28px 28px 40px; line-height:1.6; color:{text_color}; }}
            .muted {{ color: rgba(209,213,219,0.9); font-size:15px; }}
            .footer-note {{ padding:18px 24px; text-align:center; color:rgba(255,255,255,0.45); font-size:12px; }}
            a {{ color:#c7d2fe }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="header">
                    <div class="brand">{site_name}</div>
                    <div class="sub">Welcome to {site_name}</div>
                </div>
                <div class="body">
                    <p class="muted">Hi {display_name},</p>
                    <p class="muted">Thanks for signing up for {site_name}! We're excited to have you on board.</p>
                    <p class="muted">You can sign in and start using your account right away.</p>
                    {action_html}
                    <p class="muted">If you have any questions, reply to this email and we'll help.</p>
                    <p class="muted">Cheers,<br/>{site_name} Team</p>
                </div>
                <div class="footer-note">This is an automated email. Please do not reply.</div>
            </div>
        </div>
    </body>
</html>
"""
        return html
