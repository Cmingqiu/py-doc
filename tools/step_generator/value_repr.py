from __future__ import annotations

from typing import Any


TYPE_LABELS: dict[str, str] = {
    "int": "整数",
    "str": "字符串",
    "float": "浮点数",
    "bool": "布尔",
    "list": "列表",
    "dict": "字典",
    "tuple": "元组",
    "set": "集合",
    "NoneType": "空值",
}


def get_type_name(value: Any) -> str:
    """Get the Python type name for a value, with special handling for bool."""
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int):
        return "int"
    if isinstance(value, float):
        return "float"
    if isinstance(value, str):
        return "str"
    if isinstance(value, list):
        return "list"
    if isinstance(value, dict):
        return "dict"
    if isinstance(value, tuple):
        return "tuple"
    if isinstance(value, set):
        return "set"
    if value is None:
        return "NoneType"
    return type(value).__name__


def format_value(value: Any) -> str:
    """Format a Python value as a string for display in the visualizer."""
    if isinstance(value, bool):
        return str(value)
    if isinstance(value, str):
        return repr(value)
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (list, tuple, dict, set)):
        return repr(value)
    if value is None:
        return "None"
    # Custom objects — try their __repr__
    try:
        r = repr(value)
        # If it's the default <__main__.XXX object at 0x...>, use class name
        if "object at 0x" in r:
            return f"{type(value).__name__}(...)"
        return r
    except Exception:
        return f"{type(value).__name__}(...)"


def format_type_label(type_name: str) -> str:
    """Get the Chinese label for a Python type."""
    return TYPE_LABELS.get(type_name, type_name)
