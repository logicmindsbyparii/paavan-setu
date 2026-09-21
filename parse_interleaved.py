import fitz
import sys

doc = fitz.open(sys.argv[1])
for page_num in range(len(doc)):
    page = doc[page_num]
    text_instances = page.get_text("dict")["blocks"]
    
    print(f"--- Page {page_num+1} ---")
    img_idx = 0
    for block in text_instances:
        if block['type'] == 1: # Image
            print(f"[IMAGE: page{page_num+1}_img{img_idx+1}.jpeg]")
            img_idx += 1
        elif block['type'] == 0: # Text
            text = "".join([span["text"] for line in block["lines"] for span in line["spans"]])
            print(text.strip())
