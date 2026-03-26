#!/bin/bash

set -e

# Get the root directory (where this script is located)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Array of packages to update
packages=(
  "."
  "aptos"
  "berrachain"
  "cardano"
  "ethereum"
  "hysp"
  "hysp_solana"
  "polygon"
  "solana_v1"
  "solana_v2"
  "sui"
)

echo "🔄 Starting dependency update for all packages..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

failed_packages=()

for package in "${packages[@]}"; do
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Processing: $package${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  
  # Navigate to package directory
  cd "$ROOT_DIR/$package"
  
  # Run audit fix
  echo -e "${YELLOW}→ Running pnpm audit --fix${NC}"
  if ! pnpm audit --fix; then
    echo -e "${YELLOW}⚠ Audit fix had issues (this is often expected)${NC}"
  fi
  
  # Install dependencies
  echo -e "${YELLOW}→ Running pnpm install${NC}"
  if ! pnpm install; then
    echo -e "${YELLOW}⚠ pnpm install failed${NC}"
    failed_packages+=("$package")
    cd ..
    continue
  fi
  
  # Build
  echo -e "${YELLOW}→ Running npm run build${NC}"
  if ! npm run build; then
    echo -e "${YELLOW}⚠ Build failed for $package${NC}"
    failed_packages+=("$package")
    continue
  fi
  
  echo -e "${GREEN}✓ $package updated successfully!${NC}"
  echo ""
done

echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ ${#failed_packages[@]} -eq 0 ]; then
  echo -e "${GREEN}🎉 All dependencies updated successfully!${NC}"
  echo ""
  echo -e "${YELLOW}Note: ajv 8.18.0 (ReDoS fix) conflicts with eslint 9.31.0.${NC}"
  echo -e "${YELLOW}Consider updating eslint to 10.x+ for full compatibility.${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠ Failed packages:${NC}"
  for pkg in "${failed_packages[@]}"; do
    echo -e "${YELLOW}  - $pkg${NC}"
  done
  exit 1
fi
