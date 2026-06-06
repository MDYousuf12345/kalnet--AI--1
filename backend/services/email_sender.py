from dotenv import load_dotenv
load_dotenv()

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
import os
print("SMTP_SERVER =", os.getenv("SMTP_SERVER"))
print("SMTP_PORT =", os.getenv("SMTP_PORT"))
print("SMTP_EMAIL =", os.getenv("SMTP_EMAIL"))
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_EMAIL", ""),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD", ""),
    MAIL_FROM=os.getenv("SMTP_EMAIL", ""),
    MAIL_PORT=int(os.getenv("SMTP_PORT", "587")),
    MAIL_SERVER=os.getenv("SMTP_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

async def send_email(
    recipient: str,
    subject: str,
    body: str
):
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
