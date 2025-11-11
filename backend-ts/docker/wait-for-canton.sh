#!/bin/sh
set -e

LEDGER_URL="http://${LEDGER_HOST}:${LEDGER_PORT}/v2/version"
MAX_RETRIES=30
RETRY_INTERVAL=5

echo "Checking Canton availability at $LEDGER_URL"

i=1
while [ $i -le $MAX_RETRIES ]; do
  if wget -q -O /dev/null "$LEDGER_URL" 2>/dev/null || curl -s -f "$LEDGER_URL" > /dev/null 2>&1; then
    echo "Canton is ready!"
    exit 0
  fi

  echo "Attempt $i/$MAX_RETRIES: Canton not ready yet. Waiting ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
  i=$((i + 1))
done

echo "ERROR: Canton did not become ready after $MAX_RETRIES attempts"
exit 1
