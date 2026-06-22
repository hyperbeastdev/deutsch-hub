with open("src/App.jsx", "r") as f:
    content = f.read()

content = content.replace(r"\u00B7 ", r"- ")
content = content.replace(r"\u00B7", r"-")

with open("src/App.jsx", "w") as f:
    f.write(content)
