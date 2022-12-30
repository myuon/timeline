FROM node:19 as builder
ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.9/litestream-v0.3.9-linux-amd64-static.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:19 as deps
WORKDIR /app
COPY server/package*.json server/
COPY web/package*.json web/
COPY ./package*.json ./
COPY ./yarn.lock ./
RUN yarn install --frozen-lockfile --production

FROM gcr.io/distroless/nodejs:18
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder --chown=nonroot:nonroot /app/litestream.yml /etc/litestream.yml
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/.secrets ./dist/.secrets
COPY --from=builder --chown=nonroot:nonroot /app/run.sh /run.sh
COPY --from=builder --chown=nonroot:nonroot /usr/local/bin/litestream /usr/local/bin/litestream
COPY --from=deps --chown=nonroot:nonroot /app/node_modules ./node_modules
USER nonroot

# cf: https://stackoverflow.com/questions/61039877/add-shell-or-bash-to-a-docker-image-distroless-based-on-debian-gnu-linux
COPY --from=busybox:1.35.0-uclibc /bin/sh /bin/sh
COPY --from=busybox:1.35.0-uclibc /bin/mv /bin/mv
COPY --from=busybox:1.35.0-uclibc /bin/rm /bin/rm

ENTRYPOINT ["/bin/sh", "/run.sh"]
