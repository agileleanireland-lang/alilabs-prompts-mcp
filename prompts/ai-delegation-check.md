---
name: ai-delegation-check
title: AI Delegation Check
description: Assesses whether a team task should go to an AI agent, a human, or a human–agent pair, with the guardrails and review points needed.
arguments:
  - name: task
    description: The task or workflow being considered for delegation
    required: true
  - name: risk_notes
    description: Known risks, compliance limits or data sensitivity
    required: false
---
Help an agile team decide how to handle this task with AI agents.

Task: {{task}}
Known risks and constraints: {{risk_notes}}

Assess:
1. Recommendation — agent alone, human alone, or human + agent — with a one-paragraph rationale.
2. What the agent would do and what the human must still own (judgment, accountability, stakeholder contact).
3. Guardrails — review checkpoints, data limits and what "done" means.
4. A metric the team can track for two sprints to confirm the choice was right.
