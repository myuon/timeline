FROM node:19 as builder
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
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/.secrets ./.secrets
COPY --from=deps --chown=nonroot:nonroot /app/node_modules ./node_modules
USER nonroot

CMD ["dist/server/index.js"]
