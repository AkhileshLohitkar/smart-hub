from PIL import Image
import math
import sys


def is_background(r, g, b, a=255):
    if a < 10:
        return True
    # Light gray / off-white padding around the circle
    if r > 215 and g > 215 and b > 215:
        return True
    return False


def colorfulness(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    return mx - mn


src = sys.argv[1]
dst = sys.argv[2]

img = Image.open(src).convert("RGBA")
w, h = img.size
cx, cy = w / 2, h / 2
px = img.load()

# Find farthest colorful pixel from center to estimate circle radius
max_dist = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if is_background(r, g, b, a):
            continue
        if colorfulness(r, g, b) < 20 and r > 200 and g > 200 and b > 200:
            continue
        dist = math.hypot(x - cx + 0.5, y - cy + 0.5)
        max_dist = max(max_dist, dist)

radius = max_dist - 2
print(f"Detected radius: {radius:.1f}")

out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
out_px = out.load()

for y in range(h):
    for x in range(w):
        dx = x - cx + 0.5
        dy = y - cy + 0.5
        dist = math.hypot(dx, dy)
        if dist <= radius:
            r, g, b, a = px[x, y]
            if is_background(r, g, b, a):
                continue
            edge = radius - dist
            alpha = a if edge >= 1.5 else int(a * max(0, edge / 1.5))
            out_px[x, y] = (r, g, b, alpha)

left = int(cx - radius)
top = int(cy - radius)
right = int(cx + radius)
bottom = int(cy + radius)
cropped = out.crop((left, top, right, bottom))
cropped.save(dst, "PNG")
print(f"Saved {dst} ({cropped.size[0]}x{cropped.size[1]})")
