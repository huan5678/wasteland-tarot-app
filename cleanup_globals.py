#!/usr/bin/env python3
"""
Clean up duplicate ICON ANIMATIONS blocks in globals.css

This script:
1. Reads globals.css
2. Identifies all ICON ANIMATIONS blocks
3. Keeps only the first block
4. Removes all duplicate blocks
5. Preserves all other content
"""

import re

# Read the file
with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Split into lines for analysis
lines = content.split('\n')

# Find all ICON ANIMATIONS block markers
icon_anim_markers = []
for i, line in enumerate(lines):
    if line.strip() == '/* === ICON ANIMATIONS === */':
        icon_anim_markers.append(i)

print(f"Found {len(icon_anim_markers)} ICON ANIMATIONS blocks at lines: {[i+1 for i in icon_anim_markers]}")

if len(icon_anim_markers) <= 1:
    print("No duplicates found. Exiting.")
    exit(0)

# Strategy: Remove all content between 2nd marker and the last animation in the last block
# We need to identify where each block ends

# Find the end of the first block (look for next major section or @theme)
first_block_start = icon_anim_markers[0]
second_block_start = icon_anim_markers[1]

# The first block ends just before the second block starts
# Let's keep lines 0 to (second_block_start - 1)
# Then skip everything until we find content that's NOT part of ICON ANIMATIONS

# Identify blocks to remove
blocks_to_remove = []
for i in range(1, len(icon_anim_markers)):
    start = icon_anim_markers[i]
    # Find where this block ends (look for next non-animation content)
    # For simplicity, we'll look for the next major comment or the next block
    if i + 1 < len(icon_anim_markers):
        end = icon_anim_markers[i + 1] - 1
    else:
        # Last block - need to find where it actually ends
        # Look for content that doesn't match animation patterns
        end = start
        for j in range(start + 1, len(lines)):
            line = lines[j].strip()
            # If we hit a new major section (not animation-related), stop
            if (line.startswith('/* ===') and 'ICON ANIMATIONS' not in line) or \
               (line.startswith('/* Android') or line.startswith('/* iOS') or \
                line.startswith('/* Material Design') or line.startswith('/* Ripple') or \
                line.startswith('/* Mobile') or line == '/* End of Mobile Native App Layout Styles */'):
                end = j - 1
                break
            # If we're past line 4500 and hit substantial CSS, stop
            if j > 4500 and line and not line.startswith('/*') and not line.startswith('@keyframes') \
               and not line.startswith('.animate-') and not line.startswith('}'):
                end = j - 1
                break
        else:
            end = len(lines) - 1

    blocks_to_remove.append((start, end))
    print(f"Block {i} to remove: lines {start+1} to {end+1}")

# Remove blocks in reverse order to maintain line numbers
new_lines = lines.copy()
for start, end in reversed(blocks_to_remove):
    # Also remove trailing blank lines before the block
    while start > 0 and new_lines[start - 1].strip() == '':
        start -= 1

    # Remove the block
    del new_lines[start:end + 1]
    print(f"Removed lines {start+1} to {end+1}")

# Write the cleaned file
with open('src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print(f"\n✅ Cleaned globals.css")
print(f"   Original: {len(lines)} lines")
print(f"   New: {len(new_lines)} lines")
print(f"   Removed: {len(lines) - len(new_lines)} lines")
