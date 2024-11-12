# Stage 1 - Build
FROM node:20-alpine AS build

ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV REACT_APP_MAP_ID=AIzaSyAGrOQEuSTyoNP1K7VcKSvejMz9c8W0A2A
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV NODE_OPTIONS=--max-old-space-size=8192

WORKDIR /app
COPY i18n /app/i18n/
COPY images /app/images/
COPY metrics /app/metrics/
COPY assets /app/assets/
COPY packages /app/packages/
COPY public /app/public/

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build

# Stage 2 - Run
FROM node:20-alpine AS run

WORKDIR /app

#COPY --from=build /app .

EXPOSE 8080

# Start your application
CMD ["pnpm", "start"]