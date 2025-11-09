#!/usr/bin/env python3
"""
Remove unused animations from globals.css

Removes:
1. crt-flicker
2. ripple
3. glitch-1
4. grid-flicker
5. crt-scanlines
6. scan
"""

import re

# Read the file
with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Split into lines
lines = content.split('\n')

# Animations to remove
animations_to_remove = ['crt-flicker', 'ripple', 'glitch-1', 'grid-flicker', 'crt-scanlines', 'scan']

result_lines = []
skip_until_line = -1
removed_count = 0

i = 0
while i < len(lines):
    line = lines[i]

    # Skip if we're in a removal block
    if i < skip_until_line:
        i += 1
        continue

    # Check for @keyframes to remove
    for anim_name in animations_to_remove:
        pattern = rf'@keyframes\s+{re.escape(anim_name)}\s*\{{'
        if re.search(pattern, line.strip()):
            # Found animation to remove
            print(f"Removing @keyframes {anim_name} at line {i+1}")
            removed_count += 1

            # Find the end of this @keyframes block
            brace_count = 1
            j = i + 1
            while j < len(lines) and brace_count > 0:
                if '{' in lines[j]:
                    brace_count += lines[j].count('{')
                if '}' in lines[j]:
                    brace_count -= lines[j].count('}')
                j += 1

            # Also remove blank lines after
            while j < len(lines) and lines[j].strip() == '':
                j += 1

            # Check if the next line is the corresponding class
            if j < len(lines) and lines[j].strip().startswith(f'.animate-{anim_name}'):
                print(f"  Also removing .animate-{anim_name} class")
                # Skip the class block too
                while j < len(lines):
                    if lines[j].strip().endswith('}') and not lines[j].strip().startswith('/*'):
                        j += 1
                        break
                    j += 1

            # Skip trailing blank lines
            while j < len(lines) and lines[j].strip() == '':
                j += 1

            skip_until_line = j
            i += 1
            continue

    # If we didn't skip, add this line
    if i >= skip_until_line:
        result_lines.append(line)

    i += 1

# Write the result
with open('src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write('\n'.join(result_lines))

print(f"\n✅ Removed {removed_count} animations from globals.css")
print(f"   Original: {len(lines)} lines")
print(f"   New: {len(result_lines)} lines")
print(f"   Removed: {len(lines) - len(result_lines)} lines")
