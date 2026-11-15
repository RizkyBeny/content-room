import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_highlight_base(size=1080):
    im = Image.new("RGBA", (size, size), (10, 13, 18, 255)) # #0A0D12
    draw = ImageDraw.Draw(im)
    cx, cy = size // 2, size // 2

    # Subtle radar / forensic background circles
    for r in [200, 320, 440]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(22, 28, 38, 255), width=2)

    # Outer antique bronze ring (Instagram crop circle guide ~460px radius)
    outer_r = 450
    draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], outline=(197, 155, 39, 200), width=6) # #C59B27
    draw.ellipse([cx - outer_r + 12, cy - outer_r + 12, cx + outer_r - 12, cy + outer_r - 12], outline=(139, 38, 53, 180), width=2) # #8B2635

    return im, draw, cx, cy

def add_label(draw, cx, text):
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    # Position text neatly below the icon inside the circular mask (cy + 240)
    draw.text((cx - tw // 2, 770), text, font=font, fill=(197, 155, 39, 255))

def make_kasus_cover(out_path):
    im, draw, cx, cy = create_highlight_base()
    # Icon: Dossier / Case File Folder with confidential stamp
    # Folder body
    fx1, fy1, fx2, fy2 = cx - 180, cy - 130, cx + 180, cy + 150
    # Tab
    draw.polygon([(fx1, fy1), (fx1 + 140, fy1), (fx1 + 170, fy1 + 35), (fx1, fy1 + 35)], fill=(197, 155, 39, 255))
    # Main Folder
    draw.rounded_rectangle([fx1, fy1 + 30, fx2, fy2], radius=16, fill=(20, 26, 36, 255), outline=(197, 155, 39, 255), width=6)
    
    # Document paper peeking out
    draw.rectangle([fx1 + 40, fy1 - 10, fx2 - 40, fy1 + 30], fill=(230, 237, 243, 240))
    # Red Confidential / Crime tape bar across folder
    draw.polygon([(fx1 + 20, cy + 30), (fx2 - 20, cy - 10), (fx2 - 20, cy + 35), (fx1 + 20, cy + 75)], fill=(139, 38, 53, 255))

    add_label(draw, cx, "KASUS")
    im.convert("RGB").save(out_path, "JPEG", quality=95)
    print(f"Created: {out_path}")

def make_arsip_cover(out_path):
    im, draw, cx, cy = create_highlight_base()
    # Icon: Forensic Magnifying Glass with Crosshair Target
    lx, ly = cx - 20, cy - 20
    lr = 130
    # Lens rim
    draw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], outline=(197, 155, 39, 255), width=12)
    # Inner lens glow
    draw.ellipse([lx - lr + 16, ly - lr + 16, lx + lr - 16, ly + lr - 16], fill=(16, 22, 32, 255), outline=(139, 38, 53, 200), width=4)
    # Target crosshairs
    draw.line([lx - 70, ly, lx + 70, ly], fill=(230, 237, 243, 220), width=4)
    draw.line([lx, ly - 70, lx, ly + 70], fill=(230, 237, 243, 220), width=4)
    draw.ellipse([lx - 12, ly - 12, lx + 12, ly + 12], fill=(139, 38, 53, 255))
    # Handle
    hx1 = lx + int(lr * math.cos(math.radians(45)))
    hy1 = ly + int(lr * math.sin(math.radians(45)))
    hx2 = hx1 + 110
    hy2 = hy1 + 110
    draw.line([hx1, hy1, hx2, hy2], fill=(197, 155, 39, 255), width=22)

    add_label(draw, cx, "ARSIP")
    im.convert("RGB").save(out_path, "JPEG", quality=95)
    print(f"Created: {out_path}")

def make_bukti_cover(out_path):
    im, draw, cx, cy = create_highlight_base()
    # Icon: Forensic Evidence Tag & Dagger Silhouette
    # Evidence Tag
    tx1, ty1, tx2, ty2 = cx - 110, cy - 160, cx + 110, cy + 140
    # Chamfered top corners
    tag_poly = [
        (tx1 + 50, ty1),
        (tx2 - 50, ty1),
        (tx2, ty1 + 50),
        (tx2, ty2),
        (tx1, ty2),
        (tx1, ty1 + 50)
    ]
    draw.polygon(tag_poly, fill=(20, 26, 36, 255), outline=(197, 155, 39, 255))
    # Tag hole
    draw.ellipse([cx - 16, ty1 + 25, cx + 16, ty1 + 57], fill=(10, 13, 18, 255), outline=(197, 155, 39, 255), width=4)
    
    # Evidence label stamp "EVIDENCE"
    try:
        font_tag = ImageFont.truetype("/System/Library/Fonts/Courier.ttc", 36)
    except:
        font_tag = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), "EVIDENCE", font=font_tag)
    draw.text((cx - (bbox[2] - bbox[0]) // 2, cy - 40), "EVIDENCE", font=font_tag, fill=(139, 38, 53, 255))
    
    # Forensic number #01
    draw.line([cx - 70, cy + 20, cx + 70, cy + 20], fill=(197, 155, 39, 200), width=3)
    draw.text((cx - 38, cy + 35), "NO. 01", font=font_tag, fill=(230, 237, 243, 220))

    add_label(draw, cx, "BUKTI")
    im.convert("RGB").save(out_path, "JPEG", quality=95)
    print(f"Created: {out_path}")

def make_misteri_cover(out_path):
    im, draw, cx, cy = create_highlight_base()
    # Icon: Detective Noir Silhouette / Question Mark & Eye
    # Mysterious Eye in Noir Shadow
    ex, ey = cx, cy - 10
    # Eye shape
    draw.arc([ex - 150, ey - 100, ex + 150, ey + 100], start=200, end=340, fill=(197, 155, 39, 255), width=8)
    draw.arc([ex - 150, ey - 100, ex + 150, ey + 100], start=20, end=160, fill=(197, 155, 39, 255), width=8)
    
    # Iris & Pupil
    draw.ellipse([ex - 60, ey - 60, ex + 60, ey + 60], fill=(20, 26, 36, 255), outline=(139, 38, 53, 255), width=6)
    draw.ellipse([ex - 25, ey - 25, ex + 25, ey + 25], fill=(230, 237, 243, 255))
    
    # Dramatic vertical slit shadow
    draw.line([ex, ey - 110, ex, ey - 65], fill=(197, 155, 39, 200), width=4)
    draw.line([ex, ey + 65, ex, ey + 110], fill=(197, 155, 39, 200), width=4)

    add_label(draw, cx, "MISTERI")
    im.convert("RGB").save(out_path, "JPEG", quality=95)
    print(f"Created: {out_path}")

def make_timeline_cover(out_path):
    im, draw, cx, cy = create_highlight_base()
    # Icon: Crime Timeline / Pocket Watch / Chrono
    wx, wy = cx, cy - 20
    wr = 120
    # Watch rim
    draw.ellipse([wx - wr, wy - wr, wx + wr, wy + wr], outline=(197, 155, 39, 255), width=10)
    # Crown button at top
    draw.rectangle([wx - 18, wy - wr - 35, wx + 18, wy - wr], fill=(197, 155, 39, 255))
    draw.ellipse([wx - 28, wy - wr - 55, wx + 28, wy - wr - 15], outline=(197, 155, 39, 255), width=6)

    # Dial marks
    for deg in range(0, 360, 30):
        rad = math.radians(deg)
        x1 = wx + int((wr - 20) * math.cos(rad))
        y1 = wy + int((wr - 20) * math.sin(rad))
        x2 = wx + int((wr - 8) * math.cos(rad))
        y2 = wy + int((wr - 8) * math.sin(rad))
        draw.line([x1, y1, x2, y2], fill=(197, 155, 39, 220), width=3)

    # Hands at midnight crime hour (11:55)
    # Minute hand
    draw.line([wx, wy, wx - 18, wy - 75], fill=(230, 237, 243, 255), width=6)
    # Hour hand
    draw.line([wx, wy, wx - 35, wy - 45], fill=(139, 38, 53, 255), width=8)
    draw.ellipse([wx - 10, wy - 10, wx + 10, wy + 10], fill=(197, 155, 39, 255))

    add_label(draw, cx, "KRONOLOGI")
    im.convert("RGB").save(out_path, "JPEG", quality=95)
    print(f"Created: {out_path}")

if __name__ == "__main__":
    out_dir = "/Users/beny/Documents/Project-self/Content-automation/public/branding/highlights"
    os.makedirs(out_dir, exist_ok=True)
    
    make_kasus_cover(os.path.join(out_dir, "highlight-kasus.jpg"))
    make_arsip_cover(os.path.join(out_dir, "highlight-arsip.jpg"))
    make_bukti_cover(os.path.join(out_dir, "highlight-bukti.jpg"))
    make_misteri_cover(os.path.join(out_dir, "highlight-misteri.jpg"))
    make_timeline_cover(os.path.join(out_dir, "highlight-kronologi.jpg"))
