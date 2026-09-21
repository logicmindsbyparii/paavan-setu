import fitz
import sys
import os

doc = fitz.open(sys.argv[1])
out_dir = sys.argv[2]
os.makedirs(out_dir, exist_ok=True)

img_idx = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        image_name = f"page{page_num+1}_img{img_index+1}.{image_ext}"
        with open(os.path.join(out_dir, image_name), "wb") as f:
            f.write(image_bytes)
        img_idx += 1

print(f"Extracted {img_idx} images.")
