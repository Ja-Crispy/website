#!/usr/bin/env python3
"""
ASCII Art Generator for Portfolio
Converts images to colored ASCII art using PIL
"""

from PIL import Image
from pathlib import Path
import sys

# ASCII characters from darkest to lightest
ASCII_CHARS = "@%#*+=-:. "

def resize_image(image, new_width=80):
    """Resize image maintaining aspect ratio"""
    width, height = image.size
    ratio = height / width / 1.65  # Adjust for character aspect ratio
    new_height = int(new_width * ratio)
    return image.resize((new_width, new_height))

def grayscale(image):
    """Convert to grayscale"""
    return image.convert("L")

def pixels_to_ascii(image):
    """Convert pixels to ASCII characters"""
    pixels = image.getdata()
    ascii_str = ""
    for pixel in pixels:
        ascii_str += ASCII_CHARS[pixel * len(ASCII_CHARS) // 256]
    return ascii_str

def get_color_rgb(image, x, y):
    """Get RGB color at position"""
    return image.getpixel((x, y))

def generate_colored_ascii_html(input_image, output_file, columns=60):
    """Generate colored ASCII art as HTML"""
    try:
        # Load and process image
        image = Image.open(input_image)
        original_image = image.copy()  # Keep for colors

        # Resize
        image = resize_image(image, columns)
        original_image = original_image.resize(image.size)

        # Convert to grayscale for ASCII mapping
        gray_image = grayscale(image)

        # Convert to ASCII
        ascii_str = pixels_to_ascii(gray_image)

        # Split into lines
        img_width = image.width
        ascii_str_len = len(ascii_str)
        ascii_img = ""

        for i in range(0, ascii_str_len, img_width):
            ascii_img += ascii_str[i:i+img_width] + "\n"

        # Generate HTML with colors
        html = '<pre style="font-family: monospace; background: #000; padding: 20px; line-height: 1.2; letter-spacing: 0;">'

        for y in range(image.height):
            for x in range(image.width):
                char = ascii_str[y * img_width + x]
                r, g, b = original_image.getpixel((x, y))
                html += f'<span style="color: rgb({r},{g},{b});">{char}</span>'
            html += '\n'

        html += '</pre>'

        # Save
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"✓ Generated ASCII art: {output_file}")
        print(f"  Size: {image.width}x{image.height} characters")

    except Exception as e:
        print(f"✗ Error generating ASCII art: {e}")
        import traceback
        traceback.print_exc()

def generate_ascii_cat():
    """Generate ASCII cat art"""
    cat = """<pre style="font-family: monospace; color: #00FFFF; line-height: 1.2;">
    /\\_/\\
   ( o.o )
    > ^ <
   /|   |\\
  (_|   |_)
</pre>"""
    return cat

if __name__ == '__main__':
    # Create output directory
    output_dir = Path('public/assets/ascii')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate Yato character ASCII art
    yato_input = Path('yato_omg.jpg')
    if yato_input.exists():
        generate_colored_ascii_html(
            str(yato_input),
            'public/assets/ascii/yato.html',
            columns=50  # Smaller for header
        )
    else:
        print(f"⚠ Warning: {yato_input} not found")

    # Generate ASCII cat for footer
    cat_art = generate_ascii_cat()
    with open('public/assets/ascii/cat.html', 'w', encoding='utf-8') as f:
        f.write(cat_art)
    print(f"✓ Generated ASCII cat: public/assets/ascii/cat.html")

    print("\n✓ ASCII art generation complete!")
