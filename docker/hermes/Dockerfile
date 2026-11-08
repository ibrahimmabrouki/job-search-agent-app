# Since every Docker image starts from some base image, we need to specify which one we want to use.
# In this case we are using the "nousresearch/hermes-agent" image, which is a pre-built image that contains the Hermes agent and its dependencies.
# We are using a specific version of the image, identified by its SHA256 hash, to ensure that we are using a known and tested version of the image.
# Then we are going to add our managment API on top of the Hermes agent image.
# Official Hermes
# ├── Hermes Agent
# ├── Gateway
# ├── WhatsApp bridge
# ├── Node
# ├── Python
# │
# └── OUR ADDITIONS
#     └── WhatsApp management API

# starting with the official Hermes agent image
FROM nousresearch/hermes-agent@sha256:0646a376ed61710b7de1b13585b44ef73a52d4f4e33954ba1483b7ca5d97a3be

USER root

# Take this from windows -docker/hermes/manager- and put it inside the image at -/opt/hermes-manager-
COPY manager /opt/hermes-manager
# We need to copy the s6 overlay run script for the hermes-manager service into the correct location in the image so that it can be started by s6 when the container starts.
COPY s6/manager/run /etc/s6-overlay/s6-rc.d/hermes-manager/run

# Minimal s6 configuration:
# 1. "longrun" means this service should keep running.
# 2. Register hermes-manager in the normal user service bundle.
# 3. Make the startup script executable.
RUN sed -i 's/\r$//' /etc/s6-overlay/s6-rc.d/hermes-manager/run \
    && echo "longrun" > /etc/s6-overlay/s6-rc.d/hermes-manager/type \
    && touch /etc/s6-overlay/s6-rc.d/user/contents.d/hermes-manager \
    && chmod +x /etc/s6-overlay/s6-rc.d/hermes-manager/run

# We need to run the following command to install the create the new reusable image: 
# docker build -t job-search-agent-hermes:dev .\docker\hermes

# It has 3 main parts.
# docker build means: Docker, create a new image.

# Then: -t job-search-agent-hermes:dev
# means: Give the image this name: job-search-agent-hermes
# and this tag: dev
# So the full image name becomes: job-search-agent-hermes:dev
# Then: .\docker\hermes means: Look inside this folder for the Dockerfile and any files needed during the build.

# So Docker reads: C:\projects\job-search-agent-app\docker\hermes\Dockerfile and sees: FROM nousresearch/hermes-agent@sha256:...
# That means:
# Take the exact Hermes image we tested
#         ↓
# use it as the base
#         ↓
# create our image called:
# job-search-agent-hermes:dev

# Where is the new image stored?
# It is not stored inside your project folder as a normal file.
# Docker stores it inside Docker Desktop's own internal image storage.
# On your Windows machine, conceptually:
# Windows
# │
# ├── C:\projects\job-search-agent-app
# │   └── Dockerfile
# │
# └── Docker Desktop
#     └── Docker image storage
#         ├── nousresearch/hermes-agent
#         └── job-search-agent-hermes:dev

# After reading the Dockerfile and building the image, then we can run the image as a container
# Inside the running container: 
# s6 starts
#    ↓
# s6 knows about hermes-manager
#    ↓
# s6 executes "run"
#    ↓
# run executes:

# uvicorn app.main:app
#    ↓
# Uvicorn loads:

# /opt/hermes-manager/app/main.py
#    ↓
# our FastAPI Manager starts on port 9200

