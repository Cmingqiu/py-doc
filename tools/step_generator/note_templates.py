from __future__ import annotations

from .value_repr import format_type_label

NOTE_TEMPLATES: dict[str, str] = {
    "assign_create": "创建{type_label}变量 {name}",
    "assign_reassign": "{name} 被重新赋值为 {value}",
    "assign_type_change": "{name} 被重新赋值为 {value}，类型从 {old_type} 变为 {new_type}",
    "assign_multi": "多重赋值，一行创建 {n} 个变量",
    "assign_augmented": "{name} 更新为 {value}",
    "swap": "交换变量 {names}，值互换",
    "condition_true": "{expr}? 是，进入分支",
    "condition_false": "{expr}? 否，跳过分支",
    "condition_loop_enter": "{expr}? 是，进入循环体",
    "condition_loop_exit": "{expr}? 否，退出循环",
    "loop_iter_for": "第 {n} 次迭代：{var} = {value}",
    "loop_iter_while": "第 {n} 次迭代",
    "call": "调用 {func}({args})",
    "call_recursive": "需要 {func}，递归调用",
    "return_value": "{func} 返回 {value}",
    "return_base": "到达基准情况，返回 {value}",
    "output": "打印\"{text}\"",
    "output_result": "打印结果",
}


def generate_note(action: str, context: dict) -> str:
    """Generate a Chinese note string based on action type and context."""
    template_key = _select_template(action, context)
    template = NOTE_TEMPLATES.get(template_key, action)
    try:
        return template.format(**context)
    except KeyError:
        return action


def _select_template(action: str, context: dict) -> str:
    """Select the most specific template key based on action and context."""
    if action == "assign":
        if context.get("is_swap"):
            return "swap"
        if context.get("is_multi"):
            return "assign_multi"
        if context.get("type_changed"):
            return "assign_type_change"
        if context.get("is_reassign"):
            return "assign_reassign"
        if context.get("is_augmented"):
            return "assign_augmented"
        return "assign_create"

    if action == "condition":
        if context.get("is_while"):
            if context.get("branch") == "true":
                return "condition_loop_enter"
            elif context.get("branch") == "false":
                return "condition_loop_exit"
        if context.get("branch") == "true":
            return "condition_true"
        return "condition_false"

    if action == "loop_iter":
        if context.get("is_for"):
            return "loop_iter_for"
        return "loop_iter_while"

    if action == "call":
        if context.get("is_recursive"):
            return "call_recursive"
        return "call"

    if action == "return":
        if context.get("is_base_case"):
            return "return_base"
        return "return_value"

    if action == "output":
        if context.get("text"):
            return "output"
        return "output_result"

    return action
