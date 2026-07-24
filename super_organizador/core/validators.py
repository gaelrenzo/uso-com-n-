from pathlib import Path
import os
import ctypes


def path_exists(path: Path) -> bool:
    try:
        return path.exists()
    except (OSError, PermissionError):
        return False


def is_path_writable(path: Path) -> bool:
    try:
        test_file = path / ".write_test"
        test_file.touch()
        test_file.unlink()
        return True
    except (OSError, PermissionError):
        return False


def has_enough_space(path: Path, required_bytes: int = 1024 * 1024) -> bool:
    try:
        if hasattr(os, "statvfs"):
            stat = os.statvfs(path)
            free = stat.f_frsize * stat.f_bavail
            return free > required_bytes
        return True
    except (OSError, PermissionError):
        return True


def is_file_locked(path: Path) -> bool:
    try:
        with open(path, "rb") as f:
            f.read(1)
        return False
    except (OSError, PermissionError):
        return True


def is_gdrive_mounted(path: Path) -> bool:
    try:
        return path.exists()
    except (OSError, PermissionError):
        return False


def is_cloud_only(path: Path) -> bool:
    try:
        attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
        if attrs == -1:
            return False
        FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS = 0x400000
        return bool(attrs & FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS)
    except (OSError, AttributeError):
        return False


def is_path_too_long(path: Path) -> bool:
    try:
        return len(str(path)) > 260
    except (OSError, AttributeError):
        return False


def get_file_size_human(size_bytes: int) -> str:
    if size_bytes == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    while size >= 1024 and i < len(units) - 1:
        size /= 1024
        i += 1
    return f"{size:.2f} {units[i]}"
