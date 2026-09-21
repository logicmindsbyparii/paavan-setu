import re

lines = open('/home/av/.gemini/antigravity-ide/brain/14fa06dd-5700-436d-b35e-ce80a81de8d9/scratch/ideal_career_actual.txt').read().splitlines()

lost = []
current = []
for line in lines:
    if re.match(r'^\d+\.$', line.strip()):
        if current:
            text = '\n'.join(current).strip()
            if text:
                lost.append(text)
            current = []
    else:
        # ignore options
        if not re.match(r'^(Yes No|Never|May Be|Yes, Will love to|DE|DC|DB|DA|BA|BC|BD|BE|CB|CE|CD|CA|AE|AB|AC|AD|Sleep|Goat|Lamb|Flock|Forest|Shore|Hedge|Road|Night|Midnight|Dark|Afternoon|Scales|Feathers|Tail|Fins|Fur|Hair|Shoe|Hoof|Large|Larger|Largest|Super Largest|Location|no|in|position|Permisible|Permissible|Permissable|Permisable|Easiley|Easely|Easaly|Easily|132|144|120|143|37\.6|3\.76|376|10|9060|906|906000|90600|24|2400|0\.024|2\.4|1840|18400|9200|184|30|3|4|40|600|900|700|800|0\.09|11\.11|1\.11|0\.9|13|-13|-33|-10|National Youth Day|Ramakrishna Math|Hinduism|Indian Philosophy|Promote Hinduism|Attend Parliament of Religion|Conduct Lectures|None of the above|18th century|19th century|20th century|Vishwanath Datta|Narendra’s Mother|Narendra’s Father|New Delhi|Bengal|Bombay|Calcutta|Sarita|Seema|Ritu|None|Rakhi|Neetu|Ankita|Priyanka|Priyanka & Neha|Priyanka & Neetu|Neetu & Neha|Rohit|Rahul|Raunak|None Of the Above|Less important|Important|Very important|A: |A|B|C|D)$', line.strip()):
            # ignore question texts and empty lines and form feeds
            pass # wait, it's hard to distinguish question text from lost text without tracking state.

