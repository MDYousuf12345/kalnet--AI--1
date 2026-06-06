
import logging
import os
import sys
from dotenv import load_dotenv

load_dotenv()


from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(CURRENT_DIR)
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from agents.base import GROQ_API_KEY, GROQ_MODEL, initialize_llm
from agents.lead_research_agent import AI2_API_BASE
from api.routes import router


LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("kalnet_ai1.api")


def failure_response(message: str, data: Dict[str, Any] | None = None) -> Dict[str, Any]:
    return {"success": False, "data": data or {}, "error": message}


def create_app() -> FastAPI:
    app = FastAPI(
        title="KALNET AI-1 Backend",
        description="Groq-powered LLM sales agents for lead research, proposal generation, and email personalisation.",
        version="4.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    @app.on_event("startup")
    async def startup_validation() -> None:
        diagnostics = {
            "python_executable": sys.executable,
            "groq_configured": bool(GROQ_API_KEY),
            "groq_model": GROQ_MODEL,
            "ai2_endpoint": AI2_API_BASE,
            "environment": os.getenv("APP_ENV", "development"),
        }
        if GROQ_API_KEY:
            initialize_llm()
        else:
            logger.warning("GROQ_API_KEY is not configured; agent calls will use deterministic fallback responses.")
        logger.info("startup_validation", extra=diagnostics)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        first_error = exc.errors()[0] if exc.errors() else {}
        field = ".".join(str(part) for part in first_error.get("loc", []) if part != "body")
        detail = first_error.get("msg", "Invalid request payload")
        message = f"{field}: {detail}" if field else detail
        logger.warning("request_validation_failed", extra={"error": message})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=failure_response(message),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        logger.warning("http_exception", extra={"status_code": exc.status_code, "error": str(exc.detail)})
        return JSONResponse(
            status_code=exc.status_code,
            content=failure_response(str(exc.detail)),
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_exception")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=failure_response(f"Internal server error: {str(exc)}"),
        )

    return app


app = create_app()
