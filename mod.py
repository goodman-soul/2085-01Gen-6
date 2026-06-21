import re
import random
import datetime

with open('api/data.ts', 'r') as f:
    content = f.read()

print('Read file, length:', len(content))
