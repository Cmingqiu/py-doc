from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class StepVar:
    value: str
    type: str
    changed: bool = False

    def to_dict(self) -> dict:
        d: dict = {"value": self.value, "type": self.type}
        if self.changed:
            d["changed"] = True
        return d


@dataclass
class Step:
    line: int
    action: str
    vars: dict[str, StepVar] = field(default_factory=dict)
    note: str = ""
    branch: Optional[str] = None
    loopVar: Optional[str] = None
    loopValue: Optional[str] = None
    callStack: Optional[list[str]] = None
    output: Optional[str] = None

    def to_dict(self) -> dict:
        d: dict = {
            "line": self.line,
            "action": self.action,
            "vars": {k: v.to_dict() for k, v in self.vars.items()},
            "note": self.note,
        }
        if self.branch is not None:
            d["branch"] = self.branch
        if self.loopVar is not None:
            d["loopVar"] = self.loopVar
            d["loopValue"] = self.loopValue
        if self.callStack is not None:
            d["callStack"] = self.callStack
        if self.output is not None:
            d["output"] = self.output
        return d


@dataclass
class StepFile:
    title: str
    description: str
    steps: list[Step] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(
            {
                "title": self.title,
                "description": self.description,
                "steps": [s.to_dict() for s in self.steps],
            },
            ensure_ascii=False,
            indent=2,
        )
