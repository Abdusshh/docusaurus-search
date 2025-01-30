#!/usr/bin/env python3
import os
import re

def fix_title_quotes(content):
    # Match the title field in frontmatter
    pattern = r'(title:\s*)["\']{2,}(.*?)["\']{2,}'
    
    # Replace with single quotes
    fixed = re.sub(pattern, r'\1"\2"', content)
    return fixed

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if the file has frontmatter and needs fixing
        if '---' in content and 'title:' in content:
            fixed_content = fix_title_quotes(content)
            if fixed_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print(f"Fixed quotes in: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")

def main():
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
    
    # Walk through all files in the docs directory
    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(('.md', '.mdx')):
                filepath = os.path.join(root, file)
                process_file(filepath)

if __name__ == '__main__':
    main()
