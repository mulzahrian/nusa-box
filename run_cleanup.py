#!/usr/bin/env python3
import sys

# Step 1: Run cleanup_unicode.py logic
print("=" * 60)
print("STEP 1: Running cleanup_unicode.py logic")
print("=" * 60)

path = r'd:\Learning\Game\skyline\game.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

invisible_chars = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\u2060', '\u00A0', '\u202F', '\u2028', '\u2029', '\u180E', '\u061C', '\u200E', '\u200F', '\u2066', '\u2067', '\u2068', '\u2069']
total = 0
for c in invisible_chars:
    count = text.count(c)
    if count:
        print(f'Removing {count} of U+{ord(c):04X}')
        total += count
        text = text.replace(c, '' if c != '\u00A0' else ' ')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print(f'Done. Total removed/replaced: {total}')

# Step 2: Find remaining non-ASCII chars in lines 1450-1510
print("\n" + "=" * 60)
print("STEP 2: Finding non-ASCII chars in lines 1450-1510")
print("=" * 60)

with open(path, encoding='utf-8') as f:
    lines = f.read().split('\n')

found_any = False
for i, l in enumerate(lines[1449:1510], start=1449):
    for j, c in enumerate(l):
        if ord(c) > 127 or (ord(c) < 32 and c not in '\t'):
            print(f'L{i}C{j+1}: U+{ord(c):04X} {repr(c)}')
            found_any = True

if not found_any:
    print("No non-ASCII characters found in lines 1450-1510")

# Step 3: Strip additional invisible chars
print("\n" + "=" * 60)
print("STEP 3: Stripping additional invisible chars from entire file")
print("=" * 60)

with open(path, encoding='utf-8') as f:
    t = f.read()

chars = ['\u2028', '\u2029', '\u00AD', '\u034F', '\u061C', '\u115F', '\u1160', '\u17B4', '\u17B5', 
         '\u180B', '\u180C', '\u180D', '\u180E', '\u200B', '\u200C', '\u200D', '\u200E', '\u200F', 
         '\u202A', '\u202B', '\u202C', '\u202D', '\u202E', '\u2060', '\u2061', '\u2062', '\u2063', 
         '\u2064', '\u2066', '\u2067', '\u2068', '\u2069', '\u206A', '\u206B', '\u206C', '\u206D', 
         '\u206E', '\u206F', '\u3164', '\uFEFF', '\uFFA0']

n = 0
for c in chars:
    count = t.count(c)
    if count:
        n += count
        print(f'  Removing {count} of U+{ord(c):04X}')
    t = t.replace(c, '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(t)

print(f'Total stripped: {n}')
print("\n" + "=" * 60)
print("All cleanup complete!")
print("=" * 60)
