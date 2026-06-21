import os

BASE = '/Users/goodman/solo/2085/2085-01Gen-6'

def write(rel_path, content):
    full_path = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created: {rel_path}')

write('test.txt', 'hello world')
