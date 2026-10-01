#!/usr/bin/env python3
"""Build both standalone HTML entry points with embedded, licensed fonts."""
from pathlib import Path
import base64
import html

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / 'assets' / 'fonts'

def build():
    document = (ROOT / 'src' / 'template.html').read_text(encoding='utf-8')
    figtree_license = (FONTS / 'Figtree-OFL.txt').read_text(encoding='utf-8')
    roboto_license = (FONTS / 'Roboto-OFL.txt').read_text(encoding='utf-8')
    replacements = {
        '/* SEARCH_STYLES */': (ROOT / 'src' / 'search.css').read_text(encoding='utf-8'),
        '/* SEARCH_SCRIPT */': (ROOT / 'src' / 'search.js').read_text(encoding='utf-8'),
        'FONT_DATA': base64.b64encode((FONTS / 'Figtree.ttf').read_bytes()).decode('ascii'),
        'FONT_LICENSE_VISIBLE': html.escape(figtree_license),
        'FONT_LICENSE': figtree_license.replace('--', '—'),
        'ROBOTO_DATA': base64.b64encode((FONTS / 'Roboto.ttf').read_bytes()).decode('ascii'),
        'ROBOTO_LICENSE_VISIBLE': html.escape(roboto_license),
    }
    for placeholder, value in replacements.items():
        if placeholder not in document:
            raise ValueError(f'Missing template placeholder: {placeholder}')
        document = document.replace(placeholder, value)
    for name in ('index.html', 'vademecum-tipografia-ui.html'):
        (ROOT / name).write_text(document, encoding='utf-8')
        print(f'Generated {name} ({len(document.encode("utf-8")):,} bytes)')

if __name__ == '__main__':
    build()
