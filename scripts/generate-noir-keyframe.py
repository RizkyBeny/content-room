import sys
import os
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_noir_keyframe(out_path, shot_num, shot_label, headline, sub_headline, evidence_text):
    W, H = 1080, 1920
    
    # 1. Base Canvas - Deep Charcoal Slate #0D1117
    img = Image.new('RGB', (W, H), color=(13, 17, 23))
    draw = ImageDraw.Draw(img)

    # 2. Chiaroscuro Radial Lighting / Vignette
    # Create radial gradient overlay in center
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    center_x, center_y = W // 2, int(H * 0.42)
    max_radius = 650
    for r in range(max_radius, 0, -15):
        alpha = int(45 * (1.0 - (r / float(max_radius))))
        overlay_draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(22, 27, 34, alpha)
        )
    
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    # 3. Halftone Dot Grid Pattern
    dot_color = (230, 237, 243)
    step = 24
    for y in range(80, H - 80, step):
        for x in range(80, W - 80, step):
            if (x + y) % (step * 2) == 0:
                draw.ellipse([x, y, x + 2, y + 2], fill=dot_color)

    # 4. Police Evidence Outer Border (#C59B27 Dull Bronze)
    draw.rectangle([40, 40, W - 40, H - 40], outline=(197, 155, 39), width=3)
    draw.rectangle([55, 55, W - 55, H - 55], outline=(139, 38, 53), width=1)

    # 5. Top Dossier Header
    draw.rectangle([80, 80, W - 80, 150], fill=(22, 27, 34), outline=(197, 155, 39), width=2)
    # Header Text
    draw.text((W // 2 - 260, 100), "/// POLICE INVESTIGATION DOSSIER ///", fill=(197, 155, 39))

    # 6. Central Scene Graphics (Different for Shot Types)
    cx, cy = W // 2, int(H * 0.44)
    
    # Outer circle highlight
    draw.ellipse([cx - 300, cy - 300, cx + 300, cy + 300], outline=(197, 155, 39), width=2)
    draw.ellipse([cx - 280, cy - 280, cx + 280, cy + 280], outline=(22, 27, 34), width=12)

    # Dynamic Scene Silhouette
    if shot_num == 0 or shot_num == 1:
        # Menacing Hook Silhouette
        draw.polygon([
            (cx - 140, cy + 220),
            (cx - 100, cy - 140),
            (cx, cy - 220),
            (cx + 100, cy - 140),
            (cx + 140, cy + 220)
        ], fill=(9, 13, 18), outline=(197, 155, 39))
        draw.ellipse([cx - 65, cy - 260, cx + 65, cy - 140], fill=(9, 13, 18), outline=(197, 155, 39), width=2)
    elif shot_num == 4:
        # Forensic Desk 45 degree isometric grid lines
        for offset in range(-200, 220, 50):
            draw.line([(cx - 240, cy + offset), (cx + 240, cy + offset - 80)], fill=(197, 155, 39), width=1)
            draw.line([(cx + offset, cy - 160), (cx + offset - 100, cy + 180)], fill=(22, 27, 34), width=2)
        # Evidence box
        draw.rectangle([cx - 120, cy - 60, cx + 120, cy + 60], fill=(22, 27, 34), outline=(139, 38, 53), width=3)
    elif shot_num >= 12:
        # Scales of Justice / Judicial Hammer
        draw.line([(cx, cy - 220), (cx, cy + 180)], fill=(197, 155, 39), width=6)
        draw.line([(cx - 180, cy - 120), (cx + 180, cy - 120)], fill=(197, 155, 39), width=4)
        draw.polygon([(cx - 220, cy - 40), (cx - 140, cy - 40), (cx - 180, cy + 40)], fill=(9, 13, 18), outline=(197, 155, 39))
        draw.polygon([(cx + 140, cy - 40), (cx + 220, cy - 40), (cx + 180, cy + 40)], fill=(9, 13, 18), outline=(197, 155, 39))
    else:
        # General Crime Evidence Marker
        draw.rectangle([cx - 160, cy - 160, cx + 160, cy + 160], fill=(22, 27, 34), outline=(197, 155, 39), width=3)
        draw.line([(cx - 160, cy - 160), (cx + 160, cy + 160)], fill=(139, 38, 53), width=2)

    # Crime Scene Marker Ribbon Across Center
    ribbon_y = cy + 140
    draw.rectangle([cx - 240, ribbon_y, cx + 240, ribbon_y + 60], fill=(139, 38, 53), outline=(230, 237, 243), width=1)
    tag_str = f"EVIDENCE ITEM #{shot_num:02d}"
    draw.text((cx - 110, ribbon_y + 18), tag_str, fill=(230, 237, 243))

    # 7. Scene Analysis Card (Middle-Bottom)
    card_y = int(H * 0.63)
    draw.rectangle([80, card_y, W - 80, card_y + 240], fill=(9, 13, 18), outline=(197, 155, 39), width=2)
    draw.text((120, card_y + 30), "FORENSIC SCENE CLUE:", fill=(197, 155, 39))
    draw.text((120, card_y + 75), shot_label[:40], fill=(230, 237, 243))
    draw.text((120, card_y + 130), "Style: Graphic Novel Neo-Noir • Full Bleed 1080x1920", fill=(139, 148, 158))
    draw.text((120, card_y + 175), f"Dossier Note: {evidence_text[:50]}", fill=(197, 155, 39))

    # 8. Massive Distressed Typography for Headline (Bottom)
    head_y = int(H * 0.80)
    draw.text((W // 2 - 280, head_y), headline[:28].upper(), fill=(230, 237, 243))
    
    # Crimson Ribbon Banner Sub-Headline
    sub_y = head_y + 60
    draw.rectangle([120, sub_y, W - 120, sub_y + 65], fill=(139, 38, 53))
    draw.text((150, sub_y + 20), sub_headline[:36].upper(), fill=(255, 255, 255))

    # 9. Bottom Archive Seal & Safe Area Lines
    draw.text((W // 2 - 190, H - 90), f"CRIME INVESTIGATION ARCHIVE • SHOT {shot_num:02d}", fill=(72, 79, 88))

    # Ensure output dir exists and save real binary JPEG
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.save(out_path, format='JPEG', quality=95)
    print(f"✅ Generated Noir Binary Keyframe: {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--shot", type=int, default=0)
    parser.add_argument("--label", default="Forensic Crime Scene")
    parser.add_argument("--headline", default="INVESTIGASI KASUS")
    parser.add_argument("--subheadline", default="BERKAS PERKARA RAHASIA")
    parser.add_argument("--evidence", default="Bukti Forensik Terverifikasi")
    args = parser.parse_args()

    create_noir_keyframe(args.out, args.shot, args.label, args.headline, args.subheadline, args.evidence)
