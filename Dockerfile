FROM node:18 AS build
WORKDIR /src
RUN apt update \
    && apt install -y --no-install-recommends git \
    && git clone --single-branch -b main https://github.com/scramblesolutions/snort.git \
    && cd snort \
    && yarn --network-timeout 1000000 \
    && yarn build

FROM nginxinc/nginx-unprivileged:mainline-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/snort/packages/app/build /usr/share/nginx/htmlla