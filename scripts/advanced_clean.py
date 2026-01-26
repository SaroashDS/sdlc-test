import os
import re

def process_file(filepath):
    if not filepath.endswith('.tsx'):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to find blocks like ```css ... ``` or ```typescript ... ```
    # Using non-greedy match (.*?) across multiple lines
    pattern = re.compile(r'```(\w+)?\s*(.*?)```', re.DOTALL)
    
    matches = pattern.findall(content)
    
    if not matches:
        return
    
    new_tsx_content = ""
    dir_path = os.path.dirname(filepath)
    
    for lang, block_content in matches:
        block_content = block_content.strip()
        if lang in ['typescript', 'tsx', 'javascript', 'jsx'] or not lang:
            # This is likely the main code block
            # If it's the largest block, we treat it as the new content
            if len(block_content) > len(new_tsx_content):
                new_tsx_content = block_content
        elif lang == 'css':
            # This is a CSS block. We need to save it.
            # Look for CSS module imports in the TSX
            module_match = re.search(r"import styles from './([^']+)'", new_tsx_content or content)
            if module_match:
                css_filename = module_match.group(1)
                css_path = os.path.join(dir_path, css_filename)
                with open(css_path, 'w', encoding='utf-8') as cf:
                    cf.write(block_content)
                print(f"Extracted CSS to {css_path}")
            else:
                # Fallback: use the tsx filename but change extension
                base = os.path.splitext(os.path.basename(filepath))[0]
                css_path = os.path.join(dir_path, f"{base}.module.css")
                with open(css_path, 'w', encoding='utf-8') as cf:
                    cf.write(block_content)
                print(f"Extracted CSS to {css_path} (fallback)")

    if new_tsx_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_tsx_content)
        print(f"Cleaned {filepath}")

def walk_and_process(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            process_file(os.path.join(root, file))

if __name__ == "__main__":
    workspace = r"C:\tmp\ai-sdlc-workspace\story_12345"
    if os.path.exists(workspace):
        walk_and_process(workspace)
        print("Advanced cleanup complete!")
    else:
        print(f"Directory not found: {workspace}")
