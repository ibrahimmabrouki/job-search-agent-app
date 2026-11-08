"""
This is the config file/module that defines the configuration values for the Hermes Manager application.
These configuration values could be manager host, manager port, Hermes URLs, timeouts, etc. instead of scattering magic values throughout the application.
"""

import os

# This tells the Manager: Hermes API is running inside the same container on port 9119.
# So later we can build URLs like: http://127.0.0.1:9119/api/messaging/whatsapp/onboarding/start
HERMES_BASE_URL = "http://127.0.0.1:9119"

# This reads the token that already exists in your Docker Compose environment.
# You already have: HERMES_DASHBOARD_SESSION_TOKEN=${HERMES_DASHBOARD_SESSION_TOKEN}

# So: Docker Compose
# → gives token to container
# → Manager reads same token
# → Manager can authenticate to Hermes
HERMES_SESSION_TOKEN = os.getenv(
    "HERMES_DASHBOARD_SESSION_TOKEN",
    "",
)

# This stores the exact header name Hermes expects.
# Later the request will effectively contain: X-Hermes-Session-Token: <token>
HERMES_SESSION_HEADER = "X-Hermes-Session-Token"


# We keep these details in config.py so we do not repeat things like: 127.0.0.1:9119, X-Hermes-Session-Token, HERMES_DASHBOARD_SESSION_TOKEN throughout whatsapp_service.py.