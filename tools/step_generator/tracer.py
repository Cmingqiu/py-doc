from __future__ import annotations

import builtins
import sys
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TraceEvent:
    event: str  # "call", "line", "return"
    line: int
    locals_before: dict[str, Any]  # state BEFORE this line executes
    locals_after: dict[str, Any]   # state AFTER this line executes (from next event)
    func_name: str
    call_stack: list[str] = field(default_factory=list)
    return_value: Any = None
    output: str = ""


def _format_call_args(frame: Any) -> str:
    """Format function call arguments from frame locals."""
    try:
        code = frame.f_code
        argcount = code.co_argcount
        varnames = code.co_varnames[:argcount]
        args = []
        for name in varnames:
            if name in frame.f_locals:
                val = frame.f_locals[name]
                args.append(f"{val!r}")
        return ", ".join(args)
    except Exception:
        return ""


def _should_skip_var(name: str) -> bool:
    """Check if a variable should be excluded from the snapshot."""
    if name.startswith("__") and name.endswith("__"):
        return True
    if name.startswith("_"):
        return True
    return False


def _snapshot_locals(locals_dict: dict[str, Any]) -> dict[str, Any]:
    """Take a shallow snapshot of frame locals, filtering out internals."""
    return {k: v for k, v in locals_dict.items() if not _should_skip_var(k)}


def execute_safely(
    code: str,
    source_path: str,
    max_iterations: int = 10000,
) -> list[TraceEvent]:
    """Execute Python code with sys.settrace and return trace events.

    The 'line' event fires BEFORE a line executes. We record locals_before
    at that point. After processing, we do a second pass to fill in
    locals_after by looking at the next event's locals_before.

    Print output is captured by replacing builtins.print. The output from
    line N appears in the output buffer when line N+1's trace event fires,
    so we associate the captured output with the PREVIOUS line's event.
    """
    raw_events: list[dict] = []
    call_stack: list[str] = []
    output_buffer: list[str] = []
    iteration_count = 0
    original_print = builtins.print

    def capturing_print(*args: Any, **kwargs: Any) -> None:
        output = " ".join(str(a) for a in args)
        output_buffer.append(output)

    builtins.print = capturing_print  # type: ignore[assignment]

    def trace_callback(frame: Any, event: str, arg: Any) -> Any:
        nonlocal iteration_count

        # Only trace the target module
        if frame.f_code.co_filename != source_path:
            return trace_callback

        if event == "call":
            func_name = frame.f_code.co_name
            if func_name == "<module>":
                return trace_callback

            # Any pending output belongs to the previous event
            # But call events are for functions, output should go to
            # the previous line event
            captured_output = ""
            if output_buffer:
                captured_output = "\n".join(output_buffer)
                output_buffer.clear()
                # Attach to previous event if any
                if raw_events and not raw_events[-1].get("output"):
                    raw_events[-1]["output"] = captured_output
                    captured_output = ""

            args_repr = _format_call_args(frame)
            call_stack.append(f"{func_name}({args_repr})")

            raw_events.append({
                "event": "call",
                "line": frame.f_lineno,
                "locals": _snapshot_locals(frame.f_locals),
                "func_name": func_name,
                "call_stack": list(call_stack),
                "output": captured_output,
            })

        elif event == "line":
            iteration_count += 1
            if iteration_count > max_iterations:
                return None  # Stop tracing

            # Output produced by the PREVIOUS line is now available
            captured_output = ""
            if output_buffer:
                captured_output = "\n".join(output_buffer)
                output_buffer.clear()
                # Attach to the previous event (the line that produced the output)
                if raw_events:
                    raw_events[-1]["output"] = captured_output
                    captured_output = ""

            raw_events.append({
                "event": "line",
                "line": frame.f_lineno,
                "locals": _snapshot_locals(frame.f_locals),
                "func_name": frame.f_code.co_name,
                "call_stack": list(call_stack),
                "output": captured_output,
            })

        elif event == "return":
            # Capture any output that was produced just before this return
            if output_buffer:
                captured_output = "\n".join(output_buffer)
                output_buffer.clear()
                if raw_events:
                    raw_events[-1]["output"] = captured_output

            raw_events.append({
                "event": "return",
                "line": frame.f_lineno,
                "locals": _snapshot_locals(frame.f_locals),
                "func_name": frame.f_code.co_name,
                "call_stack": list(call_stack),
                "return_value": arg,
                "output": "",
            })
            if call_stack:
                call_stack.pop()

        return trace_callback

    try:
        compiled = compile(code, source_path, "exec")
        # Use the modified builtins so print is captured
        namespace: dict[str, Any] = {"__builtins__": builtins}
        sys.settrace(trace_callback)
        exec(compiled, namespace)
    except Exception as e:
        print(f"Warning: execution error in {source_path}: {e}", file=sys.stderr)
    finally:
        sys.settrace(None)
        builtins.print = original_print  # type: ignore[assignment]

    # Handle any remaining output
    if output_buffer and raw_events:
        raw_events[-1]["output"] = "\n".join(output_buffer)

    # Second pass: fill in locals_after.
    # For each event, find the next event in the SAME scope and use its locals.
    # For the last event in a scope, find the next event in the calling scope
    # (e.g., after a function returns, the module-level locals have changed).
    events: list[TraceEvent] = []
    for i, raw in enumerate(raw_events):
        locals_after = raw["locals"]

        # Look forward for the next event in the same scope
        for j in range(i + 1, len(raw_events)):
            next_raw = raw_events[j]
            if next_raw["func_name"] == raw["func_name"]:
                locals_after = next_raw["locals"]
                break
            # If we hit a return event that brings us back to our scope,
            # use the locals from the event after the return (which is in our scope)
            if next_raw["event"] == "return" and j + 1 < len(raw_events):
                after_return = raw_events[j + 1]
                if after_return["func_name"] == raw["func_name"]:
                    locals_after = after_return["locals"]
                    break

        events.append(TraceEvent(
            event=raw["event"],
            line=raw["line"],
            locals_before=raw["locals"],
            locals_after=locals_after,
            func_name=raw["func_name"],
            call_stack=raw["call_stack"],
            return_value=raw.get("return_value"),
            output=raw.get("output", ""),
        ))

    return events
