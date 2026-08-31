import os
import re

def clean_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    clean_lines = []
    
    inside_docstring = False
    
    for line in lines:
        # Handle one-liner docstrings
        if line.strip().startswith('"""') and line.strip().endswith('"""') and len(line.strip()) > 3:
            continue
            
        # Handle multi-line docstrings
        if line.strip().startswith('"""') and not inside_docstring:
            if line.strip().count('"""') == 1:
                inside_docstring = True
            continue
            
        if inside_docstring:
            if '"""' in line:
                inside_docstring = False
            continue
            
        # Handle hash comments
        if line.strip().startswith('#'):
            continue
            
        # Handle inline hash comments (but ignore URLs)
        if '#' in line and 'http' not in line:
            line = line.split('#')[0].rstrip() + '\n'
            
        clean_lines.append(line)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(clean_lines)

for root, dirs, files in os.walk('c:/Users/user/Documents/Firstdeyan/Riset Sentiment Analysis/backend'):
    if 'venv' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.py') or file.endswith('.mako'):
            path = os.path.join(root, file)
            try:
                clean_file(path)
            except Exception as e:
                print(f"Failed on {path}: {e}")

print("CLEANUP SUCCESS")
