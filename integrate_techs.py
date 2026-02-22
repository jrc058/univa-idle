#!/usr/bin/env python3
import re

# Read both files
with open('public/js/app.js', 'r') as f:
    app_content = f.read()

with open('tech-tree-expanded.js', 'r') as f:
    expanded_content = f.read()

# Extract the TECH_DEFINITIONS from expanded file (everything between the braces)
expanded_match = re.search(r'const TECH_DEFINITIONS_EXPANDED = \{(.*?)\n\};', expanded_content, re.DOTALL)
if not expanded_match:
    print("ERROR: Could not find TECH_DEFINITIONS_EXPANDED in tech-tree-expanded.js")
    exit(1)

expanded_defs_content = expanded_match.group(1)

# Find the start and end of TECH_DEFINITIONS in app.js
start_match = re.search(r'const TECH_DEFINITIONS = \{', app_content)
end_match = re.search(r'\n\};\s*\n\s*// Initialize tech state', app_content)

if not start_match or not end_match:
    print("ERROR: Could not find TECH_DEFINITIONS boundaries in app.js")
    print(f"Start found: {start_match is not None}, End found: {end_match is not None}")
    exit(1)

# Replace the content between start and end
new_app_content = (
    app_content[:start_match.end()] +
    expanded_defs_content +
    app_content[end_match.start():]
)

# Count techs
old_tech_count = len(re.findall(r'^\s+\w+: \{$', app_content, re.MULTILINE))
new_tech_count = len(re.findall(r'^\s+\w+: \{$', new_app_content, re.MULTILINE))

print(f"Old tech count: {old_tech_count}")
print(f"New tech count: {new_tech_count}")
print(f"Old file size: {len(app_content)} bytes")
print(f"New file size: {len(new_app_content)} bytes")

# Write to new file
with open('public/js/app.js.new', 'w') as f:
    f.write(new_app_content)

print("\nCreated public/js/app.js.new")
print("Review the file, then run: mv public/js/app.js.new public/js/app.js")
