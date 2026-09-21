import PyPDF2
import sys

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for i in range(len(reader.pages)):
            text = reader.pages[i].extract_text()
            if "Question 37" in text:
                print(f"--- PAGE {i} ---")
                print(text)

import glob
for pdf in glob.glob("/home/av/.gemini/antigravity-ide/brain/b6f0d1f9-5209-4340-a599-cfbc8a3fa427/.user_uploaded/*.pdf"):
    print(f"Reading {pdf}")
    extract_text(pdf)

