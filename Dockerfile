# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.20.2
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"


# Build stage - install dependencies and build all applications
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install server dependencies
COPY server/node/.npmrc server/node/package.json server/node/package-lock.json* ./server/node/
WORKDIR /app/server/node
RUN npm ci --include=dev

# Install React client dependencies
WORKDIR /app
COPY client/prebuiltPages/react/package.json client/prebuiltPages/react/package-lock.json* ./client/prebuiltPages/react/
WORKDIR /app/client/prebuiltPages/react
RUN npm ci --include=dev

# Copy all application code
WORKDIR /app
COPY server/node ./server/node
COPY client ./client

# Build React client app
WORKDIR /app/client/prebuiltPages/react
RUN npm run build

# Build server and remove dev dependencies
WORKDIR /app/server/node
RUN npm run build && npm prune --omit=dev

# Clean up React client dev dependencies
WORKDIR /app/client/prebuiltPages/react
RUN rm -rf node_modules src


# Production stage - minimal runtime image
FROM base

COPY --from=build /app /app
WORKDIR /app/server/node
ENV CLIENT_STATIC_DIRECTORY="/app/client"

EXPOSE 3000
CMD [ "npm", "run", "start-production" ]
