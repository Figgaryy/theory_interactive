"""Concatenate src/ parts into a single self-contained HTML file.

  python build.py            -> index.html (standalone, open in any browser)
                                artifact.html (body-only variant for claude.ai Artifacts)
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
# data (presets/tests) must be defined before the UI modules that use them at boot
ORDER = ['00_head.html', '10_model.js', '20_algorithms.js', '30_regex.js', '70_presets.js',
         '80_tests.js', '40_render.js', '50_ui.js', '60_modules.js', '75_exams.js', '76_exam_ui.js', '90_app.js']

body = '\n'.join(open(os.path.join(SRC, p), encoding='utf-8').read() for p in ORDER)

head, rest = body.split('<style>', 1)
style, after = rest.split('</style>', 1)
standalone = ('<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              + head + '<style>' + style + '</style>\n</head>\n<body>\n' + after + '\n</body>\n</html>\n')

open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(standalone)
open(os.path.join(ROOT, 'artifact.html'), 'w', encoding='utf-8').write(body)
print('index.html   ', len(standalone), 'bytes')
print('artifact.html', len(body), 'bytes')
