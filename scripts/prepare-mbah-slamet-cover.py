import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

base_dir = "/Users/beny/Documents/Project-self/Content-automation"
flow_out_dir = "/Users/beny/flow-mcp-out/mbah-slamet-banjarnegara"
source_cover = os.path.join(flow_out_dir, "scene-01.jpeg")
target_public = os.path.join(base_dir, "public/renders/mbah-slamet-banjarnegara/keyframes/cover-shot-00.jpg")
target_hf = os.path.join(base_dir, "hyperframes-workspace/mbah-slamet-banjarnegara/assets/cover-shot-00.jpg")

W, H = 1080, 1920

# 1. Open Flow MCP generated cover image
img = Image.open(source_cover).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)

# 2. Add dramatic top and bottom gradients for readability
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
overlay_draw = ImageDraw.Draw(overlay)

# Top gradient
for y in range(480):
    alpha = int(210 * (1.0 - (y / 480.0)))
    overlay_draw.line([(0, y), (W, y)], fill=(13, 17, 23, alpha))

# Bottom dark gradient
for y in range(H - 720, H):
    rel = (y - (H - 720)) / 720.0
    alpha = int(240 * (rel ** 1.3))
    overlay_draw.line([(0, y), (W, y)], fill=(10, 13, 18, alpha))

img = Image.alpha_composite(img, overlay)
draw = ImageDraw.Draw(img)

# 3. Outer Police Evidence Border (Antique Bronze & Crimson)
draw.rectangle([35, 35, W - 35, H - 35], outline=(197, 155, 39, 230), width=3)
draw.rectangle([48, 48, W - 48, H - 48], outline=(139, 38, 53, 200), width=2)

# 4. Top Dossier Header
draw.rectangle([70, 70, W - 70, 140], fill=(22, 27, 34, 235), outline=(197, 155, 39, 240), width=2)

# Try loading fonts
font_header = None
font_title = None
font_sub = None

try:
    font_header = ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", 32)
    font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", 74)
    font_sub = ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", 36)
except:
    try:
        font_header = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 70)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 34)
    except:
        font_header = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

header_text = "/// POLICE INVESTIGATION DOSSIER ///"
draw.text((W // 2, 105), header_text, fill=(197, 155, 39), font=font_header, anchor="mm")

# 5. Distressed Title Typography at Bottom
title_y = H - 360
title_line1 = "SERIAL KILLER"
title_line2 = "BANJARNEGARA"

# Drop shadow
for dx, dy in [(-3, -3), (3, -3), (-3, 3), (3, 3), (0, 5), (5, 5)]:
    draw.text((W // 2 + dx, title_y - 85 + dy), title_line1, fill=(0, 0, 0, 240), font=font_title, anchor="mm")
    draw.text((W // 2 + dx, title_y + dy), title_line2, fill=(0, 0, 0, 240), font=font_title, anchor="mm")

# Main white with bronze rim
draw.text((W // 2, title_y - 85), title_line1, fill=(230, 237, 243), font=font_title, anchor="mm")
draw.text((W // 2, title_y), title_line2, fill=(197, 155, 39), font=font_title, anchor="mm")

# 6. Sub-headline Ribbon Banner in Deep Dried Crimson (#8B2635)
ribbon_y = H - 240
ribbon_h = 60
ribbon_w = W - 180
ribbon_x = (W - ribbon_w) // 2

draw.rectangle(
    [ribbon_x, ribbon_y, ribbon_x + ribbon_w, ribbon_y + ribbon_h],
    fill=(139, 38, 53, 245),
    outline=(197, 155, 39, 240),
    width=2
)

sub_text = "12 NYAWA DITELAN BUKIT KEMATIAN"
draw.text((W // 2, ribbon_y + ribbon_h // 2), sub_text, fill=(255, 255, 255), font=font_sub, anchor="mm")

# Save to public and hyperframes
final_rgb = img.convert("RGB")
final_rgb.save(target_public, quality=95)
final_rgb.save(target_hf, quality=95)

print(f"✅ High-CTR Cover saved to {target_public} and {target_hf}")
