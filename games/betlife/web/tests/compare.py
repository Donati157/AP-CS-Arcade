# usage: compare.py <outdir> <shotsdir> [label]  — pairs reference frames with captures: REFERENCE | CURRENT
import sys, os
from PIL import Image, ImageDraw, ImageFont
S=os.environ.get('REF_FRAMES', os.path.dirname(os.path.abspath(__file__)))  # folder holding rewatch/<frame>.jpg reference frames
out, shots = sys.argv[1], sys.argv[2]; label = sys.argv[3] if len(sys.argv)>3 else 'BETLIFE'
os.makedirs(out, exist_ok=True)
PAIRS = {  # screen -> reference frame (None = NOT OBSERVED IN REFERENCE)
 'main':'v2_616.00','main_child':'v2_186.00','activities':'v2_486.00','mindbody':'v2_488.00','relationships':'v2_474.00','person':'v2_450.00',
 'occupation':'v2_346.00','job':'v2_306.00','jobs':'v2_326.00','school':None,'assets':'v2_434.00','shopping':'v2_356.00','shop_cars':'v2_396.00',
 'vehicle':'v2_420.00','decision':'v2_046.00','info':'v2_058.00','personcard':'v2_070.00','death':'v2_164.00','postlife':'v2_172.00','newlife':'v1_019.00',
 'pets':'v2_134.00','menu':None }
def app_area(im, top, bottom):  # crop to the app area (pt) and return at 1.5px/pt
    return im.crop((0, int(top*1.5), im.width, int(bottom*1.5)))
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)
except: font = ImageFont.load_default()
for name, ref in PAIRS.items():
    cur_path = f'{shots}/{name}.png'
    if not os.path.exists(cur_path): continue
    cur = Image.open(cur_path).convert('RGB')
    cur = app_area(cur, 52, 844)           # below the arcade bar
    if ref: r = app_area(Image.open(f'{S}/rewatch/{ref}.jpg').convert('RGB'), 47, 750)   # below status bar, above ad band
    else: r = Image.new('RGB', (585, 1055), (40,40,40)); ImageDraw.Draw(r).text((90, 500), 'NOT OBSERVED IN REFERENCE', fill='yellow', font=font)
    H = max(r.height, cur.height) + 30
    sheet = Image.new('RGB', (585*2+30, H), (20,20,20)); d = ImageDraw.Draw(sheet)
    sheet.paste(r, (0, 30)); sheet.paste(cur, (615, 30))
    d.text((8, 5), f'REFERENCE  {ref or ""}', fill='yellow', font=font); d.text((623, 5), f'{label}  {name}', fill='yellow', font=font)
    sheet.save(f'{out}/{name}.jpg', quality=82)
print('pairs written to', out)
