FROM mcr.microsoft.com/devcontainers/java:1-17-bookworm

# the base image ships a yarn apt source whose signing key expired, so every
# feature that runs apt-get update (node, docker-in-docker) dies with NO_PUBKEY.
# drop the broken source so feature installs go through.
RUN rm -f /etc/apt/sources.list.d/yarn.list
