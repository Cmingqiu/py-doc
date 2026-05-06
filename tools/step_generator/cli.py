from __future__ import annotations

import argparse
import os
import sys

from .ast_analyzer import analyze_ast
from .step_builder import build_steps
from .tracer import execute_safely


def process_file(
    py_path: str,
    force: bool = False,
    dry_run: bool = False,
    max_steps: int = 200,
    max_iterations: int = 10000,
) -> bool:
    """Process a single .py file and generate .steps.auto.json."""
    import ast as ast_module

    output_dir = os.path.dirname(py_path)
    basename = os.path.basename(py_path)
    auto_name = basename.replace(".py", ".steps.auto.json")
    auto_path = os.path.join(output_dir, auto_name)

    # Skip if auto file exists and --force not set
    if os.path.exists(auto_path) and not force:
        print(f"  Skipping {py_path} (auto file exists, use --force to overwrite)")
        return True

    # Read source
    with open(py_path, encoding="utf-8") as f:
        code = f.read()

    # Phase 1: AST analysis
    try:
        tree = ast_module.parse(code)
    except SyntaxError as e:
        print(f"  Error: syntax error in {py_path}: {e}", file=sys.stderr)
        return False

    line_map = analyze_ast(code)

    # Phase 2: Execute with tracing
    events = execute_safely(code, py_path, max_iterations=max_iterations)

    if not events:
        print(f"  Warning: no trace events for {py_path}", file=sys.stderr)
        return False

    # Phase 3: Build steps
    step_file = build_steps(code, events, line_map, tree, max_steps=max_steps)

    if not step_file.steps:
        print(f"  Warning: no steps generated for {py_path}", file=sys.stderr)
        return False

    # Phase 4: Output
    json_str = step_file.to_json()

    if dry_run:
        print(f"\n--- {py_path} ---")
        print(json_str)
        return True

    with open(auto_path, "w", encoding="utf-8") as f:
        f.write(json_str)

    print(f"  Generated {auto_path} ({len(step_file.steps)} steps)")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Auto-generate .steps.json from Python source files"
    )
    parser.add_argument(
        "source_dir",
        nargs="?",
        default="sources/",
        help="Directory containing .py files (default: sources/)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing .steps.auto.json files",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print generated steps without writing files",
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Process a single .py file",
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=200,
        help="Maximum number of steps to generate (default: 200)",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=10000,
        help="Maximum loop iterations during tracing (default: 10000)",
    )

    args = parser.parse_args()

    if args.file:
        process_file(
            args.file,
            force=args.force,
            dry_run=args.dry_run,
            max_steps=args.max_steps,
            max_iterations=args.max_iterations,
        )
        return

    # Walk the source directory
    source_dir = os.path.abspath(args.source_dir)
    if not os.path.isdir(source_dir):
        print(f"Error: {source_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    py_files: list[str] = []
    for root, _dirs, files in os.walk(source_dir):
        for fname in files:
            if fname.endswith(".py"):
                py_files.append(os.path.join(root, fname))

    if not py_files:
        print(f"No .py files found in {source_dir}", file=sys.stderr)
        return

    print(f"Processing {len(py_files)} file(s)...")
    success = 0
    for py_path in sorted(py_files):
        if process_file(
            py_path,
            force=args.force,
            dry_run=args.dry_run,
            max_steps=args.max_steps,
            max_iterations=args.max_iterations,
        ):
            success += 1

    print(f"\nDone: {success}/{len(py_files)} file(s) processed successfully")
