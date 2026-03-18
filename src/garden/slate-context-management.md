---
title: "slate: moving beyond ReAct and RLM"
type: blog
url: https://randomlabs.ai/blog/slate
tags: [llm, context-management, agents, architecture]
status: experimenting
date_added: 2026-02-08
---

random labs' technical report introducing a thread-based episodic memory architecture for single-threaded agents. covers the full taxonomy of agent architectures (ReAct, markdown plans, task trees, RLM, Devin/Manus/Altera, Claude Code/Codex) and their tradeoffs across planning, decomposition, synchronization, and expressivity.

key insight: the bottleneck in long-horizon tasks is context management, not model intelligence. "knowledge overhang" — models know more than they can tactically access.

slate's approach: an orchestrator dispatches bounded worker threads, each executing one action. threads return compressed "episodes" (episodic memory) instead of raw context. episodes compose across threads — one thread's output becomes another's input. this gives you ReAct's expressivity with subagent-level context isolation. maps cleanly onto karpathy's LLM-as-OS framing (orchestrator = kernel, threads = processes, episodes = return values, context window = RAM).

planning experiments with modifications to their thread weaving approach.
