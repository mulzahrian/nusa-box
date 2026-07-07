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
