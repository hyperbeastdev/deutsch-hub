import re

with open("src/App.jsx", "r") as f:
    content = f.read()

# Replace with entity if inside JSX text (simplistic heuristic: not inside quotes or template literals)
# But actually, U+00B7 is problematic inside node directly or strings. We can just replace it safely:
# If we replace ALL instances with `\u00B7`, it works for JS strings.
# Wait, for JSX text like `<p>Quiz · {deck.name}</p>`, replacing with `\u00B7` literally leaves `\u00B7` in the browser view.
# To be perfectly safe, let's just replace `·` with its literal character but wait, OXC was complaining about the literal `·`.
# What if we just use a regular hyphen `-` or bullet `•` character instead of `·`? The difference is very small visually.
# Wait, we can replace `·` with `&middot;` in JSX.
# Is it easier to simply write a script that processes line by line?

lines = content.split('\n')
for i, line in enumerate(lines):
    if '·' in line:
        if 'className=' in line and '<p ' in line and ('· {' in line or '} cards ·' in line or 'days left ·' in line or 'XP ·' in line or 'Reference ·' in line or 'Results ·' in line):
            lines[i] = line.replace('·', '&middot;')
        elif '<span className=' in line and '· {' in line:
            lines[i] = line.replace('·', '&middot;')
        elif '<p className=' in line and '·' in line and '&middot;' not in line.replace('·', '&middot;'):
            lines[i] = line.replace('·', '&middot;')
        else:
            lines[i] = line.replace('·', r'\u00B7')

with open("src/App.jsx", "w") as f:
    f.write('\n'.join(lines))
