# Build local monorepo image
# docker build --no-cache -t  flowise .

# Run image
# docker run -d -p 3000:3000 flowise

FROM node:20.18-alpine

# Install required packages
RUN apk add --update libc6-compat python3 make g++ \
    && apk add --no-cache build-base cairo-dev pango-dev \
    && apk add --no-cache chromium

#install PNPM globaly
RUN npm install -g pnpm

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV NODE_OPTIONS=--max-old-space-size=8192

WORKDIR /usr/src

# Copy app source
COPY . .

# Ensure the `run` script has the right permissions
RUN chmod +x /usr/src/packages/server/bin/run
RUN pnpm install

RUN pnpm build

EXPOSE 8080
EXPOSE 3000

CMD [ "pnpm", "start:default" ]
