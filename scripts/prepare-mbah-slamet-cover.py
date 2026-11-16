import os
from PIL import Image, ImageDraw, ImageFont

base_dir = "/Users/beny/Documents/Project-self/Content-automation"
flow_out_dir = "/Users/beny/flow-mcp-out/mbah-slamet-banjarnegara"
source_cover = os.path.join(flow_out_dir, "scene-01.jpeg")
target_public = os.path.join(base_dir, "public/renders/mbah-slamet-banjarnegara/keyframes/cover-shot-00.jpg")
target_hf = os.path.join(base_dir, "hyperframes-workspace/mbah-slamet-banjarnegara/assets/cover-shot-00.jpg")

W, H = 1080, 1920

# 1. Open Flow MCP generated cover image - 100% Full Bleed, NO BORDER
img = Image.open(source_cover).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)

# 2. Add subtle dark gradient for readability (only at the bottom for text, NO border framing)
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
overlay_draw = ImageDraw.Draw(overlay)

# Bottom dark gradient for text contrast
for y in range(H - 650, H):
    rel = (y - (H - 650)) / 650.0
    alpha = int(220 * (rel ** 1.2))
    overlay_draw.line([(0, y), (W, y)], fill=(10, 13, 18, alpha))

img = Image.alpha_composite(img, overlay)
draw = ImageDraw.Draw(img)

# Try loading bold typography fonts
font_title = None
font_sub = None

try:
    font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", 80)
    font_sub = ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", 36)
except:
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 76)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 34)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

# 3. Distressed Title Typography at Bottom (Full Bleed, No Outer Box Borders)
title_y = H - 340
title_line1 = "SERIAL KILLER"
title_line2 = "BANJARNEGARA"

# Bold Drop shadow
for dx, dy in [(-4, -4), (4, -4), (-4, 4), (4, 4), (0, 6), (6, 6)]:
    draw.text((W // 2 + dx, title_y - 95 + dy), title_line1, fill=(0, 0, 0, 250), font=font_title, anchor="mm")
    draw.text((W // 2 + dx, title_y + dy), title_line2, fill=(0, 0, 0, 250), font=font_title, anchor="mm")

# Main white line 1 & bronze line 2
draw.text((W // 2, title_y - 95), title_line1, fill=(230, 237, 243), font=font_title, anchor="mm")
draw.text((W // 2, title_y), title_line2, fill=(197, 155, 39), font=font_title, anchor="mm")

# 4. Ribbon Banner in Deep Dried Crimson (#8B2635)
ribbon_y = H - 220
ribbon_h = 64
ribbon_w = W - 140
ribbon_x = (W - ribbon_w) // 2

draw.rectangle(
    [ribbon_x, ribbon_y, ribbon_x + ribbon_w, ribbon_y + ribbon_h],
    fill=(139, 38, 53, 245),
    outline=(197, 155, 39, 230),
    width=2
)

sub_text = "12 NYAWA DITELAN BUKIT KEMATIAN"
draw.text((W // 2, ribbon_y + ribbon_h // 2), sub_text, fill=(255, 255, 255), font=font_sub, anchor="mm")

# Save to public and hyperframes (100% borderless)
final_rgb = img.convert("RGB")
final_rgb.save(target_public, quality=95)
final_rgb.save(target_hf, quality=95)

print(f"✅ Borderless Full-Bleed Cover saved to {target_public} and {target_hf}")
