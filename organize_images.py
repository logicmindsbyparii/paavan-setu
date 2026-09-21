import os
import shutil

images = []
for file in sorted(os.listdir('pdf_images')):
    if file.endswith('.jpeg'):
        # sort by page number then img number
        parts = file.replace('page', '').replace('.jpeg', '').split('_img')
        page = int(parts[0])
        img = int(parts[1])
        images.append((page, img, file))

images.sort()

out_dir = 'frontend/public/images/ideal-test'
os.makedirs(out_dir, exist_ok=True)

# First 45 images are Q53-Q61 (1 question + 4 options)
idx = 0
for q in range(53, 62):
    # Question image
    src = images[idx][2]
    shutil.copy(os.path.join('pdf_images', src), os.path.join(out_dir, f'q{q}.jpeg'))
    idx += 1
    
    # Options A, B, C, D
    for opt in ['A', 'B', 'C', 'D']:
        src = images[idx][2]
        shutil.copy(os.path.join('pdf_images', src), os.path.join(out_dir, f'q{q}_opt{opt}.jpeg'))
        idx += 1

# Next 9 images are Q62-Q70
for q in range(62, 71):
    src = images[idx][2]
    shutil.copy(os.path.join('pdf_images', src), os.path.join(out_dir, f'q{q}.jpeg'))
    idx += 1

print(f"Successfully processed {idx} images.")
