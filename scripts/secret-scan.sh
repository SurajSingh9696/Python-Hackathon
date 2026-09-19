#!/usr/bin/env bash
# Sahaj Secret Scanner — blocks commits that contain real secrets.
# Run manually or as a pre-commit/CI hook.
# Does NOT modify files — exits 1 if secrets found.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Sahaj secret scanner running..."

FOUND=0

# Patterns to detect (regex, case-insensitive)
PATTERNS=(
  # Generic high-entropy tokens (common API key formats)
  'sk-[a-zA-Z0-9]{20,}'              # OpenAI / Groq style
  'gsk_[a-zA-Z0-9]{40,}'             # Groq
  'xai-[a-zA-Z0-9]{40,}'             # xAI
  'AIza[0-9A-Za-z-_]{35}'            # Google API
  'ya29\.[0-9A-Za-z-_]+'             # Google OAuth
  'AKIA[0-9A-Z]{16}'                 # AWS Access Key
  'cognee_[a-zA-Z0-9]{20,}'          # Cognee key pattern
  'mongodb\+srv://[^:]+:[^@]+@'      # MongoDB Atlas URI with credentials
  'redis://:[^@]+@'                  # Redis with password
  # Private key markers
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
  # JWT secrets (long base64)
  'JWT_SECRET\s*=\s*["\x27]?.{20,}'
)

# Files to skip
SKIP_DIRS=("node_modules" ".next" "dist" "coverage" ".git" ".pnpm-store")
SKIP_FILES=(".env.example" "secret-scan.sh" "ASSUMPTIONS.md")

build_exclude_args() {
  local args=()
  for dir in "${SKIP_DIRS[@]}"; do
    args+=("--exclude-dir=$dir")
  done
  echo "${args[@]}"
}

EXCLUDE_ARGS=$(build_exclude_args)

for pattern in "${PATTERNS[@]}"; do
  # Use grep recursively, ignore binary files
  matches=$(grep -rn -E --include="*.{ts,tsx,js,mjs,json,yaml,yml,sh,env}" \
    $EXCLUDE_ARGS \
    "$pattern" . 2>/dev/null || true)

  if [[ -n "$matches" ]]; then
    # Filter out allowed files
    filtered=""
    while IFS= read -r line; do
      skip=false
      for skip_file in "${SKIP_FILES[@]}"; do
        if [[ "$line" == *"$skip_file"* ]]; then
          skip=true
          break
        fi
      done
      if [[ "$skip" == false ]]; then
        filtered+="$line\n"
      fi
    done <<< "$matches"

    if [[ -n "$filtered" ]]; then
      echo -e "${RED}❌ POTENTIAL SECRET FOUND — pattern: $pattern${NC}"
      echo -e "$filtered"
      FOUND=1
    fi
  fi
done

if [[ $FOUND -eq 1 ]]; then
  echo -e "${RED}Secret scan FAILED. Remove secrets before committing.${NC}"
  echo "Tip: Use .env.example with placeholder values. Real secrets go in .env (git-ignored)."
  exit 1
else
  echo -e "${GREEN}✅ Secret scan passed — no secrets detected.${NC}"
fi
