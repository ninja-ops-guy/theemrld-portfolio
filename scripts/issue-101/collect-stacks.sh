#!/usr/bin/env bash
set -u
mkdir -p results/stacks
find "$PLAYWRIGHT_BROWSERS_PATH" -type f \( -name 'WPEWebProcess' -o -name 'libWPEWebKit*.so*' \) > results/binaries.txt
exe=$(find "$PLAYWRIGHT_BROWSERS_PATH" -type f -name WPEWebProcess -print -quit)
lib=$(find "$PLAYWRIGHT_BROWSERS_PATH" -type f -name 'libWPEWebKit*.so*' -print -quit)
if [ -n "$lib" ]; then
  mkdir -p results/engine
  cp "$lib" results/engine/
  if [ -n "$exe" ]; then cp "$exe" results/engine/; fi
  sha256sum "$lib" > results/library-sha256.txt
  readelf -n "$lib" > results/library-notes.txt
  readelf -S "$lib" > results/library-sections.txt
  readelf -l "$lib" > results/library-segments.txt
  addr2line -f -C -e "$lib" 0x58461f9 0x5845a59 > results/previous-addresses.txt 2>&1
  objdump -d -C --start-address=0x5846180 --stop-address=0x5846250 "$lib" > results/previous-disassembly.txt 2>&1
fi
find cores -type f -printf '%f %s bytes\n' > results/core-inventory.txt
if [ -n "$exe" ]; then
  while IFS= read -r -d '' core; do
    name=$(basename "$core")
    file "$core" > "results/stacks/$name-file.txt"
    candidate="$exe"
    if file "$core" | grep -q 'WPENetworkProcess'; then candidate=$(find "$PLAYWRIGHT_BROWSERS_PATH" -type f -name WPENetworkProcess -print -quit); fi
    if file "$core" | grep -q 'MiniBrowser'; then candidate=$(find "$PLAYWRIGHT_BROWSERS_PATH" -type f -name MiniBrowser -print -quit); fi
    # Stack and instruction metadata only; do not publish raw process memory.
    timeout -k 10s 90s gdb -q -batch "$candidate" "$core" \
      -ex 'set pagination off' -ex 'set print frame-arguments none' \
      -ex 'info files' -ex 'info sharedlibrary' -ex 'info threads' \
      -ex 'thread apply all bt 40' -ex 'info registers rip rsp' \
      -ex 'x/16i $pc-24' -ex 'info symbol $pc' \
      > "results/stacks/$name.txt" 2>&1 || true
  done < <(find cores -type f -name 'core.*' -print0)
fi
