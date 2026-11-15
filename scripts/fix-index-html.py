import re

path = 'hyperframes-workspace/twitter-killer-investigation/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix timeline registration
old_reg = """    window.__timeline = tl;
    window.__timelines = [tl];"""

new_reg = """    window.__timeline = tl;
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;"""

content = content.replace(old_reg, new_reg)

# 2. Remove css transition from caption-word
old_css = """    .caption-word {
      display: inline-block;
      transition: color 0.1s ease, transform 0.1s ease;
      will-change: color, transform;
    }"""

new_css = """    .caption-word {
      display: inline-block;
      transform-origin: center center;
    }"""

content = content.replace(old_css, new_css)

# 3. Strip data-start and data-end from caption elements
# Regex to remove data-start="..." and data-end="..." inside caption phrases and words
def strip_timing_attrs(match):
    s = match.group(0)
    s = re.sub(r'\s+data-start="[^"]*"', '', s)
    s = re.sub(r'\s+data-end="[^"]*"', '', s)
    return s

# Only strip inside #caption-container
caption_section = re.search(r'(<div id="caption-container">[\s\S]*?</div>\s*</div>)', content)
if caption_section:
    orig = caption_section.group(1)
    cleaned = re.sub(r'<span\s+class="caption-word"[^>]*>', strip_timing_attrs, orig)
    cleaned = re.sub(r'<div\s+class="caption-phrase"[^>]*>', strip_timing_attrs, cleaned)
    content = content.replace(orig, cleaned)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html successfully!")
