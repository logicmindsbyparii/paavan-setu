import os
from PIL import Image

for file in sorted(os.listdir('pdf_images')):
    if file.endswith('.jpeg'):
        with Image.open(os.path.join('pdf_images', file)) as img:
            print(f"{file}: {img.size}")
