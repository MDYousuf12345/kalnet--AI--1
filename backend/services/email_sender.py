from dotenv import load_dotenv
load_dotenv()

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
import os

async def send_email(
    recipient: str,
    subject: str,
    body: str
):
    conf = ConnectionConfig(
        MAIL_USERNAME=os.getenv("SMTP_EMAIL", ""),
        MAIL_PASSWORD=os.getenv("SMTP_PASSWORD", ""),
        MAIL_FROM=os.getenv("SMTP_EMAIL", "test@example.com"),
        MAIL_PORT=int(os.getenv("SMTP_PORT", "587")),
        MAIL_SERVER=os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
    )

    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        body=body,
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return {
        "success": True,
        "recipient": recipient
    }