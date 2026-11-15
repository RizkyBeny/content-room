import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_circular_logo_a(out_path):
    # 1080x1080 high-res
    size = 1080
    im = Image.new("RGBA", (size, size), (10, 13, 18, 255)) # #0A0D12
    draw = ImageDraw.Draw(im)

    # 1. Subtle halftone / forensic grid background
    cx, cy = size // 2, size // 2
    for r in range(120, 520, 60):
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(30, 38, 50, 180), width=2)

    # Crosshair tactical lines
    draw.line([cx - 480, cy, cx + 480, cy], fill=(35, 45, 60, 200), width=2)
    draw.line([cx, cy - 480, cx, cy + 480], fill=(35, 45, 60, 200), width=2)

    # Outer decorative brass border (fits perfectly inside circular profile mask)
    border_r = 490
    draw.ellipse([cx - border_r, cy - border_r, cx + border_r, cy + border_r], outline=(197, 155, 39, 255), width=8) # #C59B27
    draw.ellipse([cx - border_r + 14, cy - border_r + 14, cx + border_r - 14, cy + border_r - 14], outline=(139, 38, 53, 220), width=3) # #8B2635

    # Secondary inner ring
    inner_r = 380
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], outline=(197, 155, 39, 140), width=3)

    # Load system serif font
    font_large = None
    font_sub = None
    font_tiny = None
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Times.ttc", 360)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
        font_tiny = ImageFont.truetype("/System/Library/Fonts/Courier.ttc", 38)
    except:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_tiny = ImageFont.load_default()

    # Draw Central Monogram "C" with Neo-Noir shadow & bronze glow
    letter = "C"
    # Shadow
    draw.text((cx - 105, cy - 250), letter, font=font_large, fill=(139, 38, 53, 240)) # Dried Crimson shadow
    # Main Bronze Letter
    draw.text((cx - 115, cy - 258), letter, font=font_large, fill=(197, 155, 39, 255)) # Antique Bronze

    # Forensic Magnifying Glass icon integrated into the center
    # Lens circle
    lens_cx, lens_cy, lens_r = cx + 70, cy - 40, 95
    draw.ellipse([lens_cx - lens_r, lens_cy - lens_r, lens_cx + lens_r, lens_cy + lens_r], outline=(230, 237, 243, 255), width=8)
    # Lens handle angled at 45 deg
    handle_len = 100
    hx = lens_cx + int(handle_len * math.cos(math.radians(45)))
    hy = lens_cy + int(handle_len * math.sin(math.radians(45)))
    draw.line([lens_cx + 65, lens_cy + 65, hx, hy], fill=(197, 155, 39, 255), width=16)

    # Target Crosshairs inside lens
    draw.line([lens_cx - 40, lens_cy, lens_cx + 40, lens_cy], fill=(139, 38, 53, 220), width=4)
    draw.line([lens_cx, lens_cy - 40, lens_cx, lens_cy + 40], fill=(139, 38, 53, 220), width=4)

    # Brand Title: CRIMCO
    title_text = "CRIMCO"
    bbox = draw.textbbox((0, 0), title_text, font=font_sub)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2, cy + 175), title_text, font=font_sub, fill=(230, 237, 243, 255))

    # Badge ribbon: TRUE CRIME ARCHIVES
    badge_text = "• TRUE CRIME ARCHIVES •"
    bbox_b = draw.textbbox((0, 0), badge_text, font=font_tiny)
    bw = bbox_b[2] - bbox_b[0]
    draw.text((cx - bw // 2, cy + 270), badge_text, font=font_tiny, fill=(197, 155, 39, 255))

    # Subtle vignette overlay
    im = im.convert("RGB")
    im.save(out_path, "JPEG", quality=95)
    print(f"Created Concept A Logo: {out_path}")

def create_circular_logo_b(out_path):
    # Concept B: Forensic Fingerprint & Wax Seal Badge
    size = 1080
    im = Image.new("RGBA", (size, size), (12, 16, 22, 255))
    draw = ImageDraw.Draw(im)
    cx, cy = size // 2, size // 2

    # Draw Gold & Crimson Ring Emblem
    draw.ellipse([cx - 490, cy - 490, cx + 490, cy + 490], outline=(197, 155, 39, 255), width=10)
    draw.ellipse([cx - 460, cy - 460, cx + 460, cy + 460], outline=(40, 50, 65, 255), width=4)

    # Stylized fingerprint curved arches in center
    for r in range(40, 280, 24):
        bbox = [cx - r, cy - 60 - r, cx + r, cy - 60 + r]
        draw.arc(bbox, start=180, end=360, fill=(139, 38, 53, 200), width=6)
        draw.arc(bbox, start=0, end=130, fill=(197, 155, 39, 220), width=6)

    # Forensic scale of justice / dagger silhouette
    draw.line([cx, cy - 260, cx, cy + 80], fill=(230, 237, 243, 255), width=10) # Blade
    draw.line([cx - 110, cy - 140, cx + 110, cy - 140], fill=(197, 155, 39, 255), width=8) # Crossguard

    # Small scales
    draw.line([cx - 90, cy - 140, cx - 110, cy - 60], fill=(197, 155, 39, 180), width=3)
    draw.line([cx + 90, cy - 140, cx + 110, cy - 60], fill=(197, 155, 39, 180), width=3)
    draw.arc([cx - 130, cy - 70, cx - 70, cy - 30], 0, 180, fill=(197, 155, 39, 220), width=4)
    draw.arc([cx + 70, cy - 70, cx + 130, cy - 30], 0, 180, fill=(197, 155, 39, 220), width=4)

    font_brand = None
    font_tag = None
    try:
        font_brand = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 90)
        font_tag = ImageFont.truetype("/System/Library/Fonts/Courier.ttc", 36)
    except:
        font_brand = ImageFont.load_default()
        font_tag = ImageFont.load_default()

    # Text: CRIMCO
    text = "CRIMCO"
    bbox = draw.textbbox((0, 0), text, font=font_brand)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2, cy + 180), text, font=font_brand, fill=(197, 155, 39, 255))

    # Text: CASE DOSSIER • EST. 2026
    sub = "CASE DOSSIER • EST. 2026"
    bbox_s = draw.textbbox((0, 0), sub, font=font_tag)
    sw = bbox_s[2] - bbox_s[0]
    draw.text((cx - sw // 2, cy + 290), sub, font=font_tag, fill=(230, 237, 243, 200))

    im = im.convert("RGB")
    im.save(out_path, "JPEG", quality=95)
    print(f"Created Concept B Logo: {out_path}")

if __name__ == "__main__":
    out_dir = "/Users/beny/Documents/Project-self/Content-automation/public/branding"
    os.makedirs(out_dir, exist_ok=True)
    create_circular_logo_a(os.path.join(out_dir, "crimco-logo-concept-a.jpg"))
    create_circular_logo_b(os.path.join(out_dir, "crimco-logo-concept-b.jpg"))
