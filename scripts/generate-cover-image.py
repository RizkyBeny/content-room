import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

base_dir = "/Users/beny/Documents/Project-self/Content-automation"
shot07_path = os.path.join(base_dir, "public/renders/twitter-killer-test/shot-07.jpg") # apartemen zama
shot02_path = os.path.join(base_dir, "public/renders/twitter-killer-test/shot-02.jpg") # suspect mugshot
out_path = os.path.join(base_dir, "public/renders/twitter-killer-test/cover-shot-00.jpg")
assets_out_path = os.path.join(base_dir, "hyperframes-workspace/twitter-killer-investigation/assets/cover-shot-00.jpg")
artifact_path = "/Users/beny/.gemini/antigravity/brain/c1f4eeab-ead0-4e16-959d-7cc9f8cd8dd2/cover_twitter_killer_hook.jpg"

W, H = 1080, 1920

# 1. Base background: Apartemen Zama
bg_img = Image.open(shot07_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)

# 2. Suspect cutout/blend in center-top
suspect_img = Image.open(shot02_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
# Enhance contrast of suspect
enhancer = ImageEnhance.Contrast(suspect_img)
suspect_img = enhancer.enhance(1.4)

# Create an oval mask for suspect in upper-middle area
mask = Image.new("L", (W, H), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.ellipse([140, 240, W - 140, 1150], fill=210)
mask = mask.filter(ImageFilter.GaussianBlur(80))

# Composite suspect over bg
composite = Image.composite(suspect_img, bg_img, mask)

# 3. Apply moody dark noir gradients (top and bottom)
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
overlay_draw = ImageDraw.Draw(overlay)

# Top gradient
for y in range(450):
    alpha = int(220 * (1.0 - (y / 450.0)))
    overlay_draw.line([(0, y), (W, y)], fill=(13, 17, 23, alpha))

# Bottom dark gradient for headline
for y in range(950, H):
    alpha = int(245 * ((y - 950.0) / (H - 950.0)))
    overlay_draw.line([(0, y), (W, y)], fill=(13, 17, 23, min(255, alpha)))

composite = Image.alpha_composite(composite, overlay)

# 4. Add Halftone Dot Pattern Grid
dots_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dots_draw = ImageDraw.Draw(dots_overlay)
step = 16
for x in range(0, W, step):
    for y in range(0, H, step):
        if (x + y) % (step * 2) == 0:
            dots_draw.ellipse([x, y, x + 2, y + 2], fill=(230, 237, 243, 15))
composite = Image.alpha_composite(composite, dots_overlay)

# 5. Draw Dramatic Typography
draw = ImageDraw.Draw(composite)

impact_font_path = "/System/Library/Fonts/Supplemental/Impact.ttf"
arial_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

font_kicker = ImageFont.truetype(arial_bold_path, 34)
font_title_huge = ImageFont.truetype(impact_font_path, 126)
font_title_mid = ImageFont.truetype(impact_font_path, 115)
font_sub = ImageFont.truetype(arial_bold_path, 42)
font_meta = ImageFont.truetype(arial_bold_path, 26)

# Kicker Badge (Top): Yellow Caution Police Tape Bar
tape_y = 180
tape_h = 56
draw.rectangle([0, tape_y, W, tape_y + tape_h], fill=(197, 155, 39, 240)) # Antique bronze
draw.rectangle([0, tape_y - 3, W, tape_y], fill=(13, 17, 23, 255))
draw.rectangle([0, tape_y + tape_h, W, tape_y + tape_h + 3], fill=(13, 17, 23, 255))

kicker_text = "/// POLICE INVESTIGATION DOSSIER: TOKYO ///"
k_box = font_kicker.getbbox(kicker_text)
kw = k_box[2] - k_box[0]
draw.text(((W - kw) // 2, tape_y + 10), kicker_text, font=font_kicker, fill=(13, 17, 23, 255))

# Suspect Tag Badge (Floating above headline)
tag_y = 960
draw.rectangle([70, tag_y, 480, tag_y + 44], fill=(139, 38, 53, 230)) # Dried crimson
draw.text((90, tag_y + 8), "TERPIDANA MATI: TAKAHIRO S.", font=font_meta, fill=(230, 237, 243, 255))

# Big Bold Main Headlines
# Line 1: "JEJAK SADIS"
# Line 2: "TWITTER"
# Line 3: "KILLER"

lines = [
    ("JEJAK SADIS", (230, 237, 243), font_title_huge, 1020),
    ("TWITTER", (197, 155, 39), font_title_huge, 1150),
    ("KILLER", (230, 237, 243), font_title_huge, 1280),
]

for text, color, font, y_pos in lines:
    t_box = font.getbbox(text)
    tw = t_box[2] - t_box[0]
    x_pos = (W - tw) // 2

    # Heavy multi-layer drop shadows
    for dx, dy in [(6, 6), (8, 8), (4, 4), (-2, 2)]:
        draw.text((x_pos + dx, y_pos + dy), text, font=font, fill=(0, 0, 0, 240))
    # Main text
    draw.text((x_pos, y_pos), text, font=font, fill=color)

# Sub-headline Ribbon: "9 NYAWA DALAM 2 BULAN"
sub_text = "9 NYAWA DALAM 2 BULAN"
sub_box = font_sub.getbbox(sub_text)
sw = sub_box[2] - sub_box[0]
sub_y = 1450

# Red ribbon box
ribbon_pad = 28
rx1 = (W - sw) // 2 - ribbon_pad
rx2 = (W + sw) // 2 + ribbon_pad
draw.rectangle([rx1, sub_y, rx2, sub_y + 68], fill=(139, 38, 53, 245), outline=(197, 155, 39), width=3)
# Subtext shadow & text
draw.text(((W - sw) // 2 + 2, sub_y + 12), sub_text, font=font_sub, fill=(0, 0, 0, 200))
draw.text(((W - sw) // 2, sub_y + 10), sub_text, font=font_sub, fill=(240, 230, 210, 255))

# Bottom Coordinates & Warning Label
btm_text = "APARTEMEN ZAMA • KANAGAWA PREFECTURE • KASUS RESMI DITUTUP"
b_box = font_meta.getbbox(btm_text)
bw = b_box[2] - b_box[0]
draw.text(((W - bw) // 2, 1750), btm_text, font=font_meta, fill=(160, 170, 185, 200))

# Save image
final_rgb = composite.convert("RGB")
final_rgb.save(out_path, quality=95)
final_rgb.save(assets_out_path, quality=95)
final_rgb.save(artifact_path, quality=95)

print(f"Cover image successfully generated and saved to:")
print(f" - {out_path}")
print(f" - {assets_out_path}")
print(f" - {artifact_path}")
