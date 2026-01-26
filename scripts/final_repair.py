import os
import re

def process_file(filepath):
    if not filepath.endswith('.tsx'):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        full_content = f.read()
    
    # Split by the code block marker
    parts = re.split(r'```', full_content)
    
    if len(parts) <= 1:
        return
    
    new_tsx_content = parts[0]
    dir_path = os.path.dirname(filepath)
    ts_filename = os.path.basename(filepath)
    
    for i in range(1, len(parts)):
        part = parts[i].strip()
        if not part:
            continue
            
        # Check if this part starts with a language identifier
        first_line = part.split('\n')[0].strip().lower()
        if first_line in ['css']:
            # This is a CSS block
            css_content = '\n'.join(part.split('\n')[1:]).strip()
            # Look for import in new_tsx_content
            module_match = re.search(r"import styles from './([^']+)'", new_tsx_content)
            if module_match:
                css_filename = module_match.group(1)
            else:
                css_filename = ts_filename.replace('.tsx', '.module.css')
            
            with open(os.path.join(dir_path, css_filename), 'w', encoding='utf-8') as cf:
                cf.write(css_content)
            print(f"Extracted CSS to {css_filename}")
        elif first_line in ['typescript', 'tsx', 'javascript', 'jsx']:
            # This is code
            code_content = '\n'.join(part.split('\n')[1:]).strip()
            new_tsx_content += "\n" + code_content
        else:
            # No language, just append logic (unless it looks like code)
            if "import" in part or "export" in part or "const" in part:
                 new_tsx_content += "\n" + part
            else:
                 # Likely just some leftovers
                 pass

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_tsx_content.strip())
    print(f"Repaired {filepath}")

def walk_and_process(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            process_file(os.path.join(root, file))

if __name__ == "__main__":
    workspace = r"C:\tmp\ai-sdlc-workspace\story_12345"
    if os.path.exists(workspace):
        walk_and_process(workspace)
        print("Final repair complete!")
    else:
        print(f"Directory not found: {workspace}")
