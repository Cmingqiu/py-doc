from __future__ import annotations

import ast
from typing import Any

from .ast_analyzer import LineInfo, analyze_ast, get_if_body_range
from .models import Step, StepFile, StepVar
from .note_templates import generate_note
from .title_extractor import extract_title_description
from .tracer import TraceEvent
from .value_repr import format_value, get_type_name, format_type_label


def build_steps(
    code: str,
    events: list[TraceEvent],
    line_map: dict[int, LineInfo],
    tree: ast.Module,
    max_steps: int = 200,
) -> StepFile:
    """Build StepFile from trace events and AST info."""
    title, description = extract_title_description(code)

    # Pre-compute if body ranges for branch detection
    if_body_ranges: dict[int, tuple[int, int]] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.If):
            rng = get_if_body_range(tree, node.lineno)
            if rng:
                if_body_ranges[node.lineno] = rng
        elif isinstance(node, ast.While):
            # Compute while body range
            if node.body:
                body_lines = [
                    n.lineno for n in ast.walk(node) if hasattr(n, "lineno") and n is not node
                ]
                if body_lines:
                    # The while body ends before the next statement after the while
                    # Find the max line in the while's direct children
                    max_body = max(n.lineno for n in ast.walk(node.body[-1]) if hasattr(n, "lineno"))
                    first_body = node.body[0].lineno
                    if_body_ranges[node.lineno] = (first_body, max_body)

    # Track state
    previous_vars: dict[str, StepVar] = {}
    steps: list[Step] = []
    loop_iterations: dict[int, int] = {}  # loop_header_line → iteration count

    # Filter out module-level return events
    filtered_events = [e for e in events if not (e.event == "return" and e.func_name == "<module>")]

    for i, event in enumerate(filtered_events):
        if len(steps) >= max_steps:
            break

        line_info = line_map.get(event.line)

        # Skip events at lines with no AST info (blank lines, comments, etc.)
        if line_info is None:
            continue

        # Skip function/class definition lines for "line" events only
        # (call events at function lines should still be processed)
        if line_info.is_func_def and event.event == "line":
            continue
        if line_info.is_class_def and event.event == "line":
            continue

        # Determine action type based on event + AST info
        step = _build_step_from_event(
            event=event,
            event_index=i,
            events=filtered_events,
            line_info=line_info,
            tree=tree,
            if_body_ranges=if_body_ranges,
            previous_vars=previous_vars,
            loop_iterations=loop_iterations,
        )

        if step is not None:
            # Update previous_vars
            for name, svar in step.vars.items():
                previous_vars[name] = svar
            steps.append(step)

    return StepFile(title=title, description=description, steps=steps)


def _build_step_from_event(
    event: TraceEvent,
    event_index: int,
    events: list[TraceEvent],
    line_info: LineInfo,
    tree: ast.Module,
    if_body_ranges: dict[int, tuple[int, int]],
    previous_vars: dict[str, StepVar],
    loop_iterations: dict[int, int],
) -> Step | None:
    """Build a single Step from a trace event."""

    # Handle call events
    if event.event == "call":
        return _build_call_step(event, previous_vars, line_info)

    # Handle return events
    if event.event == "return":
        return _build_return_step(event, previous_vars)

    # From here on, only handle "line" events
    # Use locals_after for variable state (state AFTER this line executes)

    # Print call
    if line_info.is_print_call:
        return _build_output_step(event, previous_vars)

    # Swap
    if line_info.is_swap:
        return _build_swap_step(event, previous_vars, line_info)

    # Assignment (including augmented)
    if "Assign" in line_info.node_types or "AugAssign" in line_info.node_types or "AnnAssign" in line_info.node_types:
        return _build_assign_step(event, previous_vars, line_info)

    # For loop header
    if line_info.is_for_header:
        return _build_for_iter_step(event, previous_vars, line_info, loop_iterations)

    # While loop header
    if line_info.is_while_header:
        return _build_while_step(event, event_index, events, previous_vars, line_info, if_body_ranges, loop_iterations)

    # If condition
    if "If" in line_info.node_types:
        return _build_condition_step(event, event_index, events, previous_vars, line_info, if_body_ranges)

    # Return statement — skip line events on return lines, let "return" events handle it
    if line_info.is_return:
        return None

    # Other call expressions (e.g., ll.append(10) as standalone expression)
    if "Call" in line_info.node_types and event.call_stack:
        return _build_call_step(event, previous_vars, line_info)

    # Skip other line events that don't produce meaningful steps
    return None


def _make_step_var(name: str, value: Any, previous_vars: dict[str, StepVar]) -> StepVar:
    """Create a StepVar, marking changed=True if the value differs from previous."""
    formatted = format_value(value)
    type_name = get_type_name(value)
    changed = False
    if name in previous_vars:
        if previous_vars[name].value != formatted or previous_vars[name].type != type_name:
            changed = True
    return StepVar(value=formatted, type=type_name, changed=changed)


def _get_after_locals(event: TraceEvent) -> dict[str, Any]:
    """Get the variable state after this event's line executed."""
    return event.locals_after


def _filter_relevant_vars(
    after_locals: dict[str, Any],
    target_names: list[str],
    previous_vars: dict[str, StepVar],
) -> dict[str, StepVar]:
    """Build vars dict including targets and any changed variables."""
    result: dict[str, StepVar] = {}

    # Always include target variables
    for name in target_names:
        if name in after_locals:
            result[name] = _make_step_var(name, after_locals[name], previous_vars)
        elif "." in name:
            # Handle dotted names like "self.head" — track the parent var
            parts = name.split(".", 1)
            parent = parts[0]
            if parent in after_locals and parent not in result:
                result[parent] = _make_step_var(parent, after_locals[parent], previous_vars)

    # Also include any variables that changed compared to previous state
    for name, value in after_locals.items():
        if name.startswith("_") or name.startswith("__"):
            continue
        if name in result:
            continue
        svar = _make_step_var(name, value, previous_vars)
        if svar.changed:
            result[name] = svar

    return result


def _build_assign_step(
    event: TraceEvent,
    previous_vars: dict[str, StepVar],
    line_info: LineInfo,
) -> Step:
    """Build an assign step."""
    after_locals = _get_after_locals(event)
    target_names = line_info.target_names
    vars_dict = _filter_relevant_vars(after_locals, target_names, previous_vars)

    # Determine note context
    context: dict[str, Any] = {
        "is_swap": False,
        "is_multi": len(target_names) > 1,
        "is_reassign": any(name in previous_vars for name in target_names),
        "is_augmented": line_info.is_augmented_assign,
    }

    # Check for type change
    type_changed = False
    old_type = ""
    new_type = ""
    for name in target_names:
        if name in previous_vars and name in vars_dict:
            if previous_vars[name].type != vars_dict[name].type:
                type_changed = True
                old_type = format_type_label(previous_vars[name].type)
                new_type = format_type_label(vars_dict[name].type)
                break

    context["type_changed"] = type_changed
    context["old_type"] = old_type
    context["new_type"] = new_type

    # Add name/value info for note
    if len(target_names) == 1:
        name = target_names[0]
        context["name"] = name
        context["value"] = vars_dict[name].value if name in vars_dict else ""
        context["type_label"] = format_type_label(vars_dict[name].type) if name in vars_dict else ""
    else:
        context["name"] = ", ".join(target_names)
        context["n"] = len(target_names)
        context["value"] = ""
        context["type_label"] = ""

    note = generate_note("assign", context)
    # Include callStack if present (e.g., after a function call returns)
    step_kwargs: dict[str, Any] = {"line": event.line, "action": "assign", "vars": vars_dict, "note": note}
    if event.call_stack is not None:
        step_kwargs["callStack"] = event.call_stack
    return Step(**step_kwargs)


def _build_swap_step(
    event: TraceEvent,
    previous_vars: dict[str, StepVar],
    line_info: LineInfo,
) -> Step:
    """Build a swap step."""
    after_locals = _get_after_locals(event)
    vars_dict: dict[str, StepVar] = {}
    swap_names = []
    for name in line_info.target_names:
        if name in after_locals:
            svar = _make_step_var(name, after_locals[name], previous_vars)
            svar.changed = True
            vars_dict[name] = svar
            swap_names.append(name)

    context: dict[str, Any] = {
        "is_swap": True,
        "names": " 和 ".join(swap_names),
    }
    note = generate_note("assign", context)
    return Step(line=event.line, action="swap", vars=vars_dict, note=note)


def _build_output_step(
    event: TraceEvent,
    previous_vars: dict[str, StepVar],
) -> Step:
    """Build an output step."""
    output_text = event.output
    context: dict[str, Any] = {"text": output_text}
    note = generate_note("output", context)
    return Step(
        line=event.line,
        action="output",
        vars={},
        note=note,
        output=output_text,
    )


def _build_call_step(
    event: TraceEvent,
    previous_vars: dict[str, StepVar],
    line_info: LineInfo | None = None,
) -> Step:
    """Build a call step."""
    after_locals = _get_after_locals(event)
    vars_dict: dict[str, StepVar] = {}
    for name, value in after_locals.items():
        if name.startswith("_") or name.startswith("__"):
            continue
        svar = _make_step_var(name, value, previous_vars)
        # For call events, include all function parameters (new variables)
        # and any changed variables from the outer scope
        if event.event == "call" or name not in previous_vars or svar.changed:
            vars_dict[name] = svar

    call_stack = event.call_stack if event.call_stack else []

    func_name = event.func_name
    args_str = ""
    if call_stack:
        top = call_stack[-1]
        paren_idx = top.find("(")
        if paren_idx > 0:
            func_name = top[:paren_idx]
            args_str = top[paren_idx + 1 : -1]

    is_recursive = len(call_stack) > 1 and any(
        func_name in frame for frame in call_stack[:-1]
    )

    context: dict[str, Any] = {
        "func": func_name,
        "args": args_str,
        "is_recursive": is_recursive,
    }
    note = generate_note("call", context)

    return Step(
        line=event.line,
        action="call",
        vars=vars_dict,
        note=note,
        callStack=call_stack,
    )


def _build_return_step(
    event: TraceEvent,
    previous_vars: dict[str, StepVar],
    is_explicit_return: bool = False,
) -> Step:
    """Build a return step."""
    call_stack = list(event.call_stack)

    # For explicit returns, pop the current frame from the displayed stack
    if is_explicit_return and call_stack:
        call_stack = call_stack[:-1]

    vars_dict: dict[str, StepVar] = {}
    if event.return_value is not None:
        ret_name = "result"
        vars_dict[ret_name] = _make_step_var(ret_name, event.return_value, previous_vars)
        vars_dict[ret_name].changed = True

    func_name = event.func_name
    ret_value = format_value(event.return_value) if event.return_value is not None else "None"

    # Check if this is a base case
    is_base_case = False
    if event.return_value is not None and isinstance(event.return_value, (int, float, str, bool)):
        if len(event.call_stack) > 1:
            for frame in event.call_stack[:-1]:
                if func_name in frame:
                    is_base_case = True
                    break

    context: dict[str, Any] = {
        "func": func_name,
        "value": ret_value,
        "is_base_case": is_base_case,
    }
    note = generate_note("return", context)

    return Step(
        line=event.line,
        action="return",
        vars=vars_dict,
        note=note,
        callStack=call_stack if call_stack else [],
    )


def _build_condition_step(
    event: TraceEvent,
    event_index: int,
    events: list[TraceEvent],
    previous_vars: dict[str, StepVar],
    line_info: LineInfo,
    if_body_ranges: dict[int, tuple[int, int]],
) -> Step:
    """Build a condition step (if/elif)."""
    branch = _determine_branch(event, event_index, events, event.line, if_body_ranges)

    vars_dict: dict[str, StepVar] = {}

    # For true branches, check if new variables are introduced
    if branch == "true" and event_index + 1 < len(events):
        next_event = events[event_index + 1]
        after_locals = next_event.locals_after
        for name, value in after_locals.items():
            if name.startswith("_") or name.startswith("__"):
                continue
            if name not in event.locals_after:
                svar = _make_step_var(name, value, previous_vars)
                if name not in previous_vars:
                    vars_dict[name] = svar

    # For conditions inside functions, include relevant function-scoped variables
    after_locals = _get_after_locals(event)
    for name, value in after_locals.items():
        if name.startswith("_") or name.startswith("__"):
            continue
        if name in vars_dict:
            continue
        # Include function parameters and relevant vars if inside a function
        if event.func_name != "<module>":
            svar = _make_step_var(name, value, previous_vars)
            # Only include if new or changed
            if name not in previous_vars or svar.changed:
                vars_dict[name] = svar

    expr = line_info.condition_text
    context: dict[str, Any] = {
        "expr": expr,
        "branch": branch,
        "is_while": False,
    }
    note = generate_note("condition", context)

    return Step(
        line=event.line,
        action="condition",
        vars=vars_dict,
        note=note,
        branch=branch,
    )


def _build_for_iter_step(
    event: TraceEvent,
    previous_vars: dict[str, StepVar],
    line_info: LineInfo,
    loop_iterations: dict[int, int],
) -> Step | None:
    """Build a loop_iter step for a for loop."""
    loop_line = event.line
    after_locals = _get_after_locals(event)
    loop_var = line_info.loop_var
    loop_value = ""

    if loop_var and loop_var in after_locals:
        loop_value = format_value(after_locals[loop_var])

    # Skip the final re-entry of the for header (after loop ends)
    # The loop variable retains its last value, so loopValue == previous value
    if loop_var and loop_var in previous_vars:
        if previous_vars[loop_var].value == loop_value and loop_line in loop_iterations:
            # This is the final re-entry, skip it
            return None

    if loop_line not in loop_iterations:
        loop_iterations[loop_line] = 0
    loop_iterations[loop_line] += 1
    iteration = loop_iterations[loop_line]

    # Include the loop variable and any changed accumulator vars
    vars_dict: dict[str, StepVar] = {}
    if loop_var and loop_var in after_locals:
        vars_dict[loop_var] = _make_step_var(loop_var, after_locals[loop_var], previous_vars)

    for name, value in after_locals.items():
        if name.startswith("_") or name.startswith("__"):
            continue
        if name in vars_dict:
            continue
        svar = _make_step_var(name, value, previous_vars)
        if svar.changed:
            vars_dict[name] = svar

    context: dict[str, Any] = {
        "n": iteration,
        "var": loop_var,
        "value": loop_value,
        "is_for": True,
    }
    note = generate_note("loop_iter", context)

    return Step(
        line=event.line,
        action="loop_iter",
        vars=vars_dict,
        note=note,
        loopVar=loop_var,
        loopValue=loop_value,
    )


def _build_while_step(
    event: TraceEvent,
    event_index: int,
    events: list[TraceEvent],
    previous_vars: dict[str, StepVar],
    line_info: LineInfo,
    if_body_ranges: dict[int, tuple[int, int]],
    loop_iterations: dict[int, int],
) -> Step:
    """Build a condition step for a while loop."""
    loop_line = event.line
    branch = _determine_branch(event, event_index, events, loop_line, if_body_ranges)

    if loop_line not in loop_iterations:
        loop_iterations[loop_line] = 0

    if branch == "true":
        loop_iterations[loop_line] += 1

    expr = line_info.condition_text
    after_locals = _get_after_locals(event)
    vars_dict: dict[str, StepVar] = {}
    for name, value in after_locals.items():
        if name.startswith("_") or name.startswith("__"):
            continue
        svar = _make_step_var(name, value, previous_vars)
        if svar.changed:
            vars_dict[name] = svar

    context: dict[str, Any] = {
        "expr": expr,
        "branch": branch,
        "is_while": True,
        "n": loop_iterations[loop_line],
    }
    note = generate_note("condition", context)

    return Step(
        line=event.line,
        action="condition",
        vars=vars_dict,
        note=note,
        branch=branch,
    )


def _determine_branch(
    event: TraceEvent,
    event_index: int,
    events: list[TraceEvent],
    condition_line: int,
    if_body_ranges: dict[int, tuple[int, int]],
) -> str:
    """Determine if a condition branch was taken by examining the next event."""
    if event_index + 1 >= len(events):
        return "false"

    next_event = events[event_index + 1]
    next_line = next_event.line

    # Check if the next executed line is inside the if body
    if condition_line in if_body_ranges:
        first_body, last_body = if_body_ranges[condition_line]
        if first_body <= next_line <= last_body:
            return "true"
        return "false"

    # Fallback: if next line is just after the condition line (inside the body)
    if next_line > condition_line and next_line <= condition_line + 5:
        return "true"

    return "false"
