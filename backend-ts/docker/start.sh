#!/bin/sh
set -e

echo "Waiting for Canton to be ready..."
/app/wait-for-canton.sh

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - continuing"

# Source onboarding environment if available (contains APP_PROVIDER_PARTY)
if [ -f /onboarding/backend-service/on/backend-service.sh ]; then
  echo "Sourcing onboarding environment..."
  . /onboarding/backend-service/on/backend-service.sh
  export APP_PROVIDER_PARTY
fi

# Verify APP_PROVIDER_PARTY is set
if [ -z "$APP_PROVIDER_PARTY" ]; then
  echo "WARNING: APP_PROVIDER_PARTY is not set. Some operations may fail."
fi

echo "Starting backend service..."
exec node dist/index.js
