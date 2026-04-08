FROM rust:bookworm AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN rustup toolchain install nightly --profile minimal
RUN rustup default nightly
RUN rustup target add wasm32-unknown-unknown
RUN cargo install --locked just wasm-pack
RUN npm install --global rollup

WORKDIR /app

COPY . .

RUN just build-release

FROM caddy:2-alpine AS runner

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/public /srv

EXPOSE 8080
