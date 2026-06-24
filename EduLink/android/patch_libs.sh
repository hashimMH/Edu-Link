#!/bin/bash
# Patch all .so files in Gradle cache for 16 KB alignment
CACHE=~/.gradle/caches
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

count=0
while IFS= read -r so; do
    python3 /Users/hashim/EduLink-Project/EduLink/android/elf_fix.py "$(dirname "$so")" > /dev/null 2>&1
    count=$((count+1))
done < <(find "$CACHE" -name "libreactnative.so" -path "*/arm64-v8a/*" 2>/dev/null)

echo "Patched directories: $count"
