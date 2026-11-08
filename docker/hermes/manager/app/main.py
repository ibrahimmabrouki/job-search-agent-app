"""
This is the main entry point for the Hermes Manager application
The main shoul only create the FastAPI app and include the routers for the different endpoints. The actual logic for the endpoints should be in the controllers and services.

Its job is basically:
receive request
→ call service
→ return response
"""

from fastapi import FastAPI
from app.api.router import api_router


def create_app() -> FastAPI:
    """
    Create and configure the Hermes Manager API application.

    Keeping application creation inside a function makes the service
    easier to test and extend without putting startup logic at module level.
    """

    application = FastAPI(
        title="Hermes Manager API",
        version="1.0.0",
        # Disable the default docs and redoc endpoints, as we will provide our own custom documentation.
        # because this manager is an internal infrastructure service, not a public API. We don't need Swagger exposed by default. We can change that later for development if useful.
        docs_url=None,
        redoc_url=None,
    )
    # health.py ==> defines GET /health ==> api/router.py ==> includes health_routermain.py ==> includes api_router ==> FastAPI application ==> GET /health is now available
    application.include_router(api_router)
    return application


app = create_app()
