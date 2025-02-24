COPY .gitmodules .gitmodules
RUN git submodule update --init --recursive

RUN [ -f ".gitmodules" ] && sed -i 's/original/replacement/g' .gitmodules || echo ".gitmodules not found, skipping sed"
RUN pwd && git submodule update --init --recursive

FROM node:current AS build
WORKDIR /src
RUN apt update \
    && apt install -y --no-install-recommends git \
    && git clone --single-branch -b main https://git.v0l.io/Kieran/snort \
    && cd snort \
    && yarn --network-timeout 1000000 \
    && yarn build

FROM nginxinc/nginx-unprivileged:mainline-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/snort/packages/app/build /usr/share/nginx/html
