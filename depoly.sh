#!/bin/bash

# Build the Docker image
docker build -t discord-parse .

# Tag the Docker image
docker tag discord-parse hereokay/discord-parse

# Push the Docker image to the registry
docker push hereokay/discord-parse