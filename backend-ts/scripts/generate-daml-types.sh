#!/bin/bash
set -e

DAML_PROJECT_DIR="../daml/licensing"
OUTPUT_DIR="./src/ledger/contracts"

echo "Generating TypeScript types from DAML..."

# Check if DAML project exists
if [ ! -d "$DAML_PROJECT_DIR" ]; then
  echo "Error: DAML project directory not found at $DAML_PROJECT_DIR"
  exit 1
fi

cd "$DAML_PROJECT_DIR"

# Build DAML project
echo "Building DAML project..."
daml build

# Find the DAR file
DAR_FILE=$(find .daml/dist -name "*.dar" | head -n 1)

if [ -z "$DAR_FILE" ]; then
  echo "Error: No DAR file found after build"
  exit 1
fi

echo "Found DAR file: $DAR_FILE"

# Generate TypeScript bindings
echo "Generating TypeScript bindings..."
daml codegen js "$DAR_FILE" -o "../../backend-ts/$OUTPUT_DIR"

echo "✓ TypeScript types generated successfully in $OUTPUT_DIR"
