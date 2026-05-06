from __future__ import annotations

import ast
from dataclasses import dataclass, field


@dataclass
class LineInfo:
    """AST-derived info for a single source line."""

    node_types: list[str] = field(default_factory=list)
    is_swap: bool = False
    is_augmented_assign: bool = False
    is_print_call: bool = False
    target_names: list[str] = field(default_factory=list)
    condition_text: str = ""
    loop_var: str = ""
    call_name: str = ""
    func_name: str = ""
    is_for_header: bool = False
    is_while_header: bool = False
    is_return: bool = False
    is_func_def: bool = False
    is_class_def: bool = False


def _is_swap_assignment(node: ast.Assign) -> bool:
    """Detect x, y = y, x pattern."""
    if not (
        isinstance(node.targets[0], ast.Tuple) and isinstance(node.value, ast.Tuple)
    ):
        return False
    target_names = {
        elt.id for elt in node.targets[0].elts if isinstance(elt, ast.Name)
    }
    value_names = {elt.id for elt in node.value.elts if isinstance(elt, ast.Name)}
    return target_names == value_names and len(target_names) >= 2


def _get_target_names(node: ast.AST) -> list[str]:
    """Extract variable names from assignment targets."""
    names: list[str] = []
    if isinstance(node, ast.Name):
        names.append(node.id)
    elif isinstance(node, ast.Tuple):
        for elt in node.elts:
            names.extend(_get_target_names(elt))
    elif isinstance(node, ast.Attribute):
        # self.xxx = ... → track as "self.xxx"
        names.append(ast.unparse(node))
    elif isinstance(node, ast.Subscript):
        names.append(ast.unparse(node))
    return names


def _get_call_name(node: ast.Call) -> str:
    """Extract function name from a Call node."""
    if isinstance(node.func, ast.Name):
        return node.func.id
    if isinstance(node.func, ast.Attribute):
        return ast.unparse(node.func)
    return ast.unparse(node.func)


def _is_print_call(node: ast.Call) -> bool:
    """Check if a Call node is a print() call."""
    return isinstance(node.func, ast.Name) and node.func.id == "print"


def analyze_ast(code: str) -> dict[int, LineInfo]:
    """Parse Python source code and return a line-number → LineInfo mapping."""
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return {}

    line_map: dict[int, LineInfo] = {}

    def get_info(line: int) -> LineInfo:
        if line not in line_map:
            line_map[line] = LineInfo()
        return line_map[line]

    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            info = get_info(node.lineno)
            info.node_types.append("Assign")
            if _is_swap_assignment(node):
                info.is_swap = True
                # Still extract target names for swap display
                for target in node.targets:
                    info.target_names.extend(_get_target_names(target))
            else:
                for target in node.targets:
                    info.target_names.extend(_get_target_names(target))

        elif isinstance(node, ast.AugAssign):
            info = get_info(node.lineno)
            info.node_types.append("AugAssign")
            info.is_augmented_assign = True
            info.target_names.extend(_get_target_names(node.target))

        elif isinstance(node, ast.AnnAssign):
            info = get_info(node.lineno)
            info.node_types.append("AnnAssign")
            if node.target:
                info.target_names.extend(_get_target_names(node.target))

        elif isinstance(node, ast.If):
            info = get_info(node.lineno)
            info.node_types.append("If")
            info.condition_text = ast.unparse(node.test)

        elif isinstance(node, ast.For):
            info = get_info(node.lineno)
            info.node_types.append("For")
            info.is_for_header = True
            if isinstance(node.target, ast.Name):
                info.loop_var = node.target.id
            else:
                info.loop_var = ast.unparse(node.target)

        elif isinstance(node, ast.While):
            info = get_info(node.lineno)
            info.node_types.append("While")
            info.is_while_header = True
            info.condition_text = ast.unparse(node.test)

        elif isinstance(node, ast.Return):
            info = get_info(node.lineno)
            info.node_types.append("Return")
            info.is_return = True

        elif isinstance(node, ast.FunctionDef):
            info = get_info(node.lineno)
            info.node_types.append("FunctionDef")
            info.is_func_def = True
            info.func_name = node.name

        elif isinstance(node, ast.ClassDef):
            info = get_info(node.lineno)
            info.node_types.append("ClassDef")
            info.is_class_def = True

        elif isinstance(node, ast.Expr):
            # Expression statement — check for function calls
            if isinstance(node.value, ast.Call):
                info = get_info(node.lineno)
                call = node.value
                if _is_print_call(call):
                    info.node_types.append("Print")
                    info.is_print_call = True
                else:
                    info.node_types.append("Call")
                    info.call_name = _get_call_name(call)

    # Also build a mapping of which lines are inside which if/for/while blocks
    # This is needed for branch detection
    return line_map


def get_if_body_range(tree: ast.Module, if_lineno: int) -> tuple[int, int] | None:
    """Get the line range of an if-statement's body (first branch)."""
    for node in ast.walk(tree):
        if isinstance(node, ast.If) and node.lineno == if_lineno:
            if node.body:
                first_body = node.body[0].lineno
                # Find end of the if body (before elif/else)
                # Walk body nodes to find max line
                max_line = max(n.lineno for n in ast.walk(node.body[0]) if hasattr(n, "lineno"))
                for child in node.body[1:]:
                    child_max = max(n.lineno for n in ast.walk(child) if hasattr(n, "lineno"))
                    max_line = max(max_line, child_max)
                return (first_body, max_line)
    return None


def get_if_elif_lines(tree: ast.Module) -> dict[int, list[int]]:
    """Get mapping: if_line → [elif/else lines] for branch detection."""
    result: dict[int, list[int]] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.If):
            lines = []
            # elif chains are nested as orelse containing another If
            current = node
            while current.orelse:
                if isinstance(current.orelse[0], ast.If):
                    elif_node = current.orelse[0]
                    lines.append(elif_node.lineno)
                    current = elif_node
                else:
                    # else block
                    for else_item in current.orelse:
                        if hasattr(else_item, "lineno"):
                            lines.append(else_item.lineno)
                    break
            result[node.lineno] = lines
    return result
