import fitz

doc = fitz.open('/home/av/.gemini/antigravity-ide/brain/a6f099ad-50ae-4283-99a1-c164ccb1ea49/.user_uploaded/media_1789748633542.pdf')
out = []
image_counter = 1

for page_num in range(17, 37):
    page = doc[page_num]
    blocks = page.get_text('dict')['blocks']
    
    page_items = []
    
    for b in blocks:
        if b['type'] == 0:  # text
            text = ' '.join([s['text'] for l in b['lines'] for s in l['spans']]).strip()
            if text:
                page_items.append({'y0': b['bbox'][1], 'type': 'text', 'content': text[:80].replace('\n', ' ')})
        elif b['type'] == 1:  # image
            page_items.append({'y0': b['bbox'][1], 'type': 'image', 'name': f'page{page_num+1}_img{len([i for i in page_items if i["type"] == "image"]) + 1}'})
            
    page_items.sort(key=lambda x: x['y0'])
    out.append(f'--- PAGE {page_num+1} ---')
    for item in page_items:
        if item['type'] == 'image':
            out.append(f"{item['y0']:.1f}: [IMAGE] {item['name']}")
        else:
            out.append(f"{item['y0']:.1f}: [TEXT] {item['content']}")

print('\n'.join(out))
