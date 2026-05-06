from __future__ import annotations


def extract_title_description(code: str) -> tuple[str, str]:
    """Extract title and description from the first two comment lines."""
    lines = code.strip().split("\n")
    comments = [
        line.strip().lstrip("#").strip()
        for line in lines
        if line.strip().startswith("#")
    ]
    title = comments[0] if len(comments) > 0 else "Untitled"
    description = comments[1] if len(comments) > 1 else ""
    return title, description
