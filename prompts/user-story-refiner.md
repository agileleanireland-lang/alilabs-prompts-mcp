---
name: user-story-refiner
title: User Story Refiner
description: Rewrites a rough backlog item as a well-formed user story with INVEST checks and testable acceptance criteria.
arguments:
  - name: backlog_item
    description: The rough idea, ticket or request to refine
    required: true
  - name: persona
    description: Who the user is, if known
    required: false
---
Refine this backlog item into a user story.

Backlog item: {{backlog_item}}
Persona: {{persona}}

Return:
- The story in "As a …, I want …, so that …" form.
- 3 to 6 acceptance criteria in Given / When / Then form.
- An INVEST check (Independent, Negotiable, Valuable, Estimable, Small, Testable), flagging any that fail and how to fix them.
- If the item is too big, a suggested split into smaller stories.
- Open questions the team should answer before estimating.
