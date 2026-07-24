import json
import logging
from pathlib import Path
from .scanner import Scanner, ScannedItem

logger = logging.getLogger(__name__)


def build_tree(items, root_path):
    tree = {"name": root_path.name, "type": "directory", "children": []}
    lookup = {str(root_path): tree}
    for item in items:
        try:
            rel = item.path.relative_to(root_path)
        except ValueError:
            continue
        current_path = root_path
        for part in rel.parts:
            parent_path = str(current_path)
            current_path = current_path / part
            if str(current_path) not in lookup:
                entry = {"name": part, "type": "directory", "children": []}
                if not item.is_dir and part == rel.parts[-1]:
                    entry = {"name": part, "type": "file", "extension": item.extension, "size": item.size_bytes, "modified": item.modified}
                lookup[parent_path]["children"].append(entry)
                lookup[str(current_path)] = entry
    return tree


def tree_to_text(tree, prefix=""):
    lines = []
    children = tree.get("children", [])
    for i, child in enumerate(children):
        is_last = i == len(children) - 1
        conn = "└── " if is_last else "├── "
        if child["type"] == "directory":
            lines.append(f"{prefix}{conn}{child['name']}/")
            ext = "    " if is_last else "│   "
            lines.extend(tree_to_text(child, prefix + ext))
        else:
            lines.append(f"{prefix}{conn}{child['name']}")
    return lines


def tree_to_markdown(tree, level=0):
    lines = []
    for child in tree.get("children", []):
        indent = "  " * level
        if child["type"] == "directory":
            lines.append(f"{indent}- **{child['name']}/**")
            lines.extend(tree_to_markdown(child, level + 1))
        else:
            lines.append(f"{indent}- {child['name']}")
    return lines


def save_tree_txt(tree, path):
    lines = tree_to_text(tree)
    with open(path, "w", encoding="utf-8") as f:
        f.write(tree["name"] + "/\n")
        f.write("\n".join(lines))


def save_tree_markdown(tree, path):
    lines = tree_to_markdown(tree)
    with open(path, "w", encoding="utf-8") as f:
        f.write("# Arbol de archivos\n\n")
        f.write("\n".join(lines))


def save_tree_json(tree, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)
