#!/bin/sh
set -e

if [ -f "./prisma/schema.prisma" ]; then
  npx prisma migrate deploy
fi

exec "$@"
