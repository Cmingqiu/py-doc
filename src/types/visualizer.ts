export interface StepVar {
  value: string;
  type: string;
  changed?: boolean;
}

export interface Step {
  line: number;
  action: "assign" | "condition" | "loop_iter" | "call" | "return" | "output" | "swap";
  vars: Record<string, StepVar>;
  note: string;
  branch?: "true" | "false";
  loopVar?: string;
  loopValue?: string;
  callStack?: string[];
  output?: string;
}

export interface StepFile {
  title: string;
  description: string;
  steps: Step[];
}

export interface SourceFile {
  slug: string;
  category: string;
  title: string;
  description: string;
  code: string;
  steps: StepFile;
}
