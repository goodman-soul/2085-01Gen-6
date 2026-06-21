import sys

filepath = sys.argv[1]
with open(filepath, 'r') as f:
    lines = f.readlines()

result = []
i = 0
skip_until_catch = False
while i < len(lines):
    line = lines[i]
    if 'const handleSubmit = async () =>' in line:
        pass
    result.append(line)
    i += 1

with open(filepath, 'w') as f:
    f.writelines(result)
