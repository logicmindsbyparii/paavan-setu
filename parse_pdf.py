import fitz # PyMuPDF
import sys

doc = fitz.open(sys.argv[1])
for i, page in enumerate(doc):
    print(f"--- Page {i+1} ---")
    print(page.get_text())
