"""Generate favicon from Qik Worksheets logo (circular emblem only)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "attached_assets" / "IMG_6540_(1)_1772323458180.png"
PUBLIC = ROOT / "client" / "public"


def main() -> None:
    img = Image.open(LOGO).convert("RGBA")
    w, h = img.size

    # Logo layout: circular emblem on top, text below. Crop upper ~62% for the circle only.
    crop_h = int(h * 0.62)
    emblem = img.crop((0, 0, w, crop_h))

    # Square crop centered on emblem width
    side = min(w, crop_h)
    left = (w - side) // 2
    emblem = emblem.crop((left, 0, left + side, side))

    # Make near-black background transparent for cleaner tab appearance
    pixels = emblem.load()
    for y in range(emblem.height):
        for x in range(emblem.width):
            r, g, b, a = pixels[x, y]
            if r < 25 and g < 25 and b < 25:
                pixels[x, y] = (0, 0, 0, 0)

    PUBLIC.mkdir(parents=True, exist_ok=True)

    for size, name in [(32, "favicon.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png")]:
        resized = emblem.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(PUBLIC / name, optimize=True)

    # ICO with multiple sizes for broader browser support
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [emblem.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
    ico_images[0].save(PUBLIC / "favicon.ico", format="ICO", sizes=ico_sizes)

    print(f"Created favicons in {PUBLIC}")


if __name__ == "__main__":
    main()
