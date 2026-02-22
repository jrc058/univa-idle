#!/usr/bin/env python3
import re

# Read the expanded tech tree
with open('tech-tree-expanded.js', 'r') as f:
    expanded = f.read()

# Extract just the object content (between { and };)
match = re.search(r'const TECH_DEFINITIONS_EXPANDED = \{(.*?)\};', expanded, re.DOTALL)
if not match:
    print("ERROR: Could not find tech definitions")
    exit(1)

new_tech_content = match.group(1)

# Read the current app.js
with open('public/js/app.js', 'r') as f:
    lines = f.readlines()

# Find the start and end lines
start_line = None
end_line = None
for i, line in enumerate(lines):
    if line.startswith('const TECH_DEFINITIONS = {'):
        start_line = i
    if line.startswith('// Initialize tech state'):
        end_line = i
        break

if start_line is None or end_line is None:
    print(f"ERROR: Could not find boundaries (start={start_line}, end={end_line})")
    exit(1)

print(f"Replacing lines {start_line+1} to {end_line}")
print(f"Old tech tree: {end_line - start_line - 1} lines")
print(f"New tech tree: {len(new_tech_content.split(chr(10)))} lines")

# Build the new file
new_lines = (
    lines[:start_line] +
    ['const TECH_DEFINITIONS = {' + new_tech_content + '};\n\n'] +
    lines[end_line:]
)

# Write it out
with open('public/js/app.js', 'w') as f:
    f.writelines(new_lines)

print("✓ Integration complete")
