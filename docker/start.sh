#!/bin/sh
set -eu

# Docker sets HOSTNAME to the container id and appends it after Compose env.
# Next.js standalone does `server.listen(port, process.env.HOSTNAME)`, so that
# name becomes the bind address. Inside a bridge network it resolves to
# 127.0.0.1 and published-port connections are reset.
# Bind the host loopback instead. Compose runs this container with host
# networking, so 127.0.0.1 here is the machine's loopback.
bind_host="${BIND_HOST:-127.0.0.1}"
port="${PORT:-3010}"

export HOSTNAME="$bind_host"
export PORT="$port"

echo "swapface listening on ${HOSTNAME}:${PORT}"
exec node server.js
