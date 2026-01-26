import os

def clean_file(filepath):
    if not filepath.endswith(('.tsx', '.ts', '.css', '.json')):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    changed = False
    lines = content.split('\n')
    
    # Remove leading backticks
    if lines and lines[0].startswith('```'):
        lines = lines[1:]
        changed = True
    
    # Remove trailing backticks
    if lines and lines[-1].strip() == '```':
        lines = lines[:-1]
        changed = True
        
    if changed:
        new_content = '\n'.join(lines).strip()
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned {filepath}")

def walk_and_clean(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            clean_file(os.path.join(root, file))

if __name__ == "__main__":
    workspace = r"C:\tmp\ai-sdlc-workspace\story_12345"
    if os.path.exists(workspace):
        walk_and_clean(workspace)
        print("Cleanup complete!")
    else:
        print(f"Directory not found: {workspace}")
