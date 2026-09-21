import fitz # PyMuPDF
import os

pdf_file = "/home/av/.gemini/antigravity-ide/brain/14fa06dd-5700-436d-b35e-ce80a81de8d9/.user_uploaded/media_1789821378241.pdf"
doc = fitz.open(pdf_file)
output_dir = "pdf_images"
os.makedirs(output_dir, exist_ok=True)

for i in range(len(doc)):
    page = doc[i]
    images = page.get_images(full=True)
    if images:
        print(f"Page {i+1}: {len(images)} images found")
        for j, img in enumerate(images):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            with open(f"{output_dir}/page{i+1}_img{j+1}.{ext}", "wb") as f:
                f.write(image_bytes)
