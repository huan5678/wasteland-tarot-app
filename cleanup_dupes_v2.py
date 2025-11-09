#!/usr/bin/env python3
"""
Remove duplicate @keyframes definitions in globals.css
Keep the first occurrence of each animation, remove all subsequent duplicates
"""

import re

# Read the file
with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Track which keyframes we've seen
seen_keyframes = set()

# Split into lines
lines = content.split('\n')
result_lines = []
skip_until_line = -1
current_keyframe = None

i = 0
while i < len(lines):
    line = lines[i]

    # Check if we should skip this line (part of duplicate keyframe)
    if i < skip_until_line:
        i += 1
        continue

    # Check for @keyframes declaration
    keyframe_match = re.match(r'^@keyframes\s+(\S+)\s*\{', line.strip())
    if keyframe_match:
        keyframe_name = keyframe_match.group(1)

        if keyframe_name in seen_keyframes:
            # This is a duplicate - find where it ends and skip it
            brace_count = 1
            j = i + 1
            while j < len(lines) and brace_count > 0:
                if '{' in lines[j]:
                    brace_count += lines[j].count('{')
                if '}' in lines[j]:
                    brace_count -= lines[j].count('}')
                j += 1

            # Also skip the associated class rule if it follows
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            if j < len(lines) and lines[j].strip().startswith(f'.animate-{keyframe_name}'):
                # Skip the class rule too
                while j < len(lines):
                    if lines[j].strip().endswith('}') and not lines[j].strip().startswith('/*'):
                        j += 1
                        break
                    j += 1

            print(f"Skipping duplicate @keyframes {keyframe_name} at line {i+1}")
            skip_until_line = j
            i += 1
            continue
        else:
            # First occurrence - keep it
            seen_keyframes.add(keyframe_name)
            print(f"Keeping @keyframes {keyframe_name} at line {i+1}")

    result_lines.append(line)
    i += 1

# Write the result
with open('src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write('\n'.join(result_lines))

print(f"\n✅ Cleaned globals.css")
print(f"   Original: {len(lines)} lines")
print(f"   New: {len(result_lines)} lines")
print(f"   Removed: {len(lines) - len(result_lines)} lines")
print(f"   Unique keyframes: {len(seen_keyframes)}")
print(f"   Keyframes: {sorted(seen_keyframes)}")
