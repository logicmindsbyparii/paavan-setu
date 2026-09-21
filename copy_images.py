import os
import shutil

extracted_dir = 'extracted_images'
public_dir = 'frontend/public/images/stream-selector'

# 1. Clean up old images
for f in os.listdir(public_dir):
    if (f.startswith('img-') and f.endswith('.png')) or (f.startswith('q') and f.endswith('.png')):
        os.remove(os.path.join(public_dir, f))

# 2. Mapping
mapping = {
    61: {'main': 'page18_img1.jpeg'},
    62: {'main': 'page18_img2.jpeg'},
    63: {'main': 'page19_img1.jpeg'},
    64: {'main': 'page19_img2.jpeg'},
    65: {'main': 'page20_img1.jpeg'},
    66: {'main': 'page20_img2.jpeg'},
    67: {'main': 'page21_img1.jpeg'},
    68: {'main': 'page21_img2.jpeg'},
    69: {'main': 'page22_img1.jpeg'},
    70: {'main': 'page23_img1.jpeg'},
    71: {'main': 'page23_img2.jpeg'},
    72: {'main': 'page23_img3.jpeg'},
    73: {'main': 'page24_img1.jpeg'},
    74: {'main': 'page24_img2.jpeg'},
    75: {'main': 'page24_img3.jpeg'},
    76: {'main': 'page25_img1.jpeg'},
    77: {'main': 'page25_img2.jpeg'},
    78: {'main': 'page25_img3.jpeg'},
    79: {'main': 'page26_img1.jpeg'},
    80: {'main': 'page26_img2.jpeg'},
    81: {'main': 'page26_img3.jpeg', 'opts': ['page27_img1.jpeg', 'page27_img2.jpeg', 'page27_img3.jpeg']},
    82: {'opts': ['page27_img4.jpeg', 'page27_img5.jpeg', 'page27_img6.jpeg']},
    83: {'main': 'page28_img1.jpeg'},
    84: {'main': 'page28_img2.jpeg', 'opts': ['page28_img3.jpeg', 'page28_img4.jpeg', 'page28_img5.jpeg']},
    85: {'main': 'page29_img1.jpeg', 'opts': ['page29_img2.jpeg', 'page29_img3.jpeg', 'page29_img4.jpeg']},
    86: {'main': 'page29_img5.jpeg', 'opts': ['page30_img1.jpeg', 'page30_img2.jpeg', 'page30_img3.jpeg']},
    87: {'main': 'page30_img4.jpeg', 'opts': ['page30_img5.jpeg', 'page30_img6.jpeg', 'page30_img7.jpeg']},
    88: {'main': 'page31_img1.jpeg', 'opts': ['page31_img2.jpeg', 'page31_img3.jpeg', 'page31_img4.jpeg']},
    89: {'main': 'page31_img5.jpeg', 'opts': ['page32_img1.jpeg', 'page32_img2.jpeg', 'page32_img3.jpeg']},
    90: {'main': 'page32_img4.jpeg', 'opts': ['page32_img5.jpeg', 'page32_img6.jpeg', 'page32_img7.jpeg']},
    95: {'main': 'page34_img1.jpeg'},
    98: {'main': 'page35_img1.jpeg'},
    99: {'main': 'page36_img1.jpeg', 'opts': ['page36_img2.jpeg', 'page36_img3.jpeg', 'page36_img4.jpeg']},
    100: {'main': 'page36_img5.jpeg', 'opts': ['page37_img1.jpeg', 'page37_img2.jpeg', 'page37_img3.jpeg']}
}

for q, imgs in mapping.items():
    if 'main' in imgs:
        shutil.copy(os.path.join(extracted_dir, imgs['main']), os.path.join(public_dir, f'q{q}_main.jpeg'))
    if 'opts' in imgs:
        for idx, opt_img in enumerate(imgs['opts']):
            shutil.copy(os.path.join(extracted_dir, opt_img), os.path.join(public_dir, f'q{q}_opt{idx}.jpeg'))
print("Successfully mapped and copied images.")
