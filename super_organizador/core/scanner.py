import logging
from pathlib import Path
from typing import Generator, Optional
from dataclasses import dataclass, field
import hashlib
import time

from .validators import is_cloud_only, is_file_locked, is_path_too_long
from .normalizer import normalize_text

logger = logging.getLogger(__name__)

IGNORED_FILES = {
    "desktop.ini", "Thumbs.db", ".DS_Store",
    "System Volume Information", "$RECYCLE.BIN",
}

IGNORED_DIRS = {
    ".git", ".svn", ".hg", "__pycache__", ".venv",
    "venv", "node_modules", ".next", "dist", "build",
    ".tox", ".eggs", "egg-info",
}


@dataclass
class ScannedItem:
    path: Path
    name: str
    is_dir: bool
    size_bytes: int
    extension: str
    created: float
    modified: float
    parent: str
    depth: int
    is_cloud_only: bool = False
    is_locked: bool = False
    is_too_long: bool = False
    hash_sha256: str = ""


class Scanner:
    def __init__(self, root_path: Path, max_depth: int = 10,
                 max_items: int = 50000, include_hidden: bool = False):
        self.root_path = root_path.resolve()
        self.max_depth = max_depth
        self.max_items = max_items
        self.include_hidden = include_hidden
        self._cancelled = False

    def cancel(self):
        self._cancelled = True

    def scan(self) -> list[ScannedItem]:
        items = []
        self._cancelled = False
        try:
            for item in self._walk(self.root_path, 0):
                if self._cancelled:
                    break
                items.append(item)
                if len(items) >= self.max_items:
                    break
        except (OSError, PermissionError) as e:
            logging.getLogger(__name__).warning(f"Error scanning: {e}")
        return items

    def _walk(self, path: Path, depth: int) -> list[ScannedItem]:
        items = []
        if depth > self.max_depth:
            return items
        try:
            for entry in path.iterdir():
                if self._cancelled:
                    break
                if not self.include_hidden and entry.name.startswith("."):
                    continue
                if entry.name in IGNORED_FILES:
                    continue
                if entry.is_dir() and entry.name in IGNORED_DIRS:
                    continue
                try:
                    stat = entry.stat()
                except (OSError, PermissionError):
                    continue
                item = ScannedItem(
                    path=entry,
                    name=entry.name,
                    is_dir=entry.is_dir(),
                    size_bytes=stat.st_size if entry.is_file() else 0,
                    extension=entry.suffix.lower() if entry.is_file() else "",
                    created=stat.st_ctime,
                    modified=stat.st_mtime,
                    parent=str(entry.parent),
                    depth=len(entry.relative_to(self.root_path).parts) if entry != self.root_path else 0,
                )
                items.append(item)
                if entry.is_dir():
                    try:
                        sub_items = self._walk(entry, depth + 1)
                        items.extend(sub_items)
                    except (OSError, PermissionError):
                        pass
        except (OSError, PermissionError):
            pass
        return items
