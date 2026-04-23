# WHY Commenting Rules (STRICT)

## Core Requirement
Whenever generating code, you MUST include comments that explain WHY the code is written the way it is.

## Forbidden
- Do NOT explain what the code does
- Do NOT restate logic
- Do NOT give generic comments

## Required Focus
- Why this approach was chosen over alternatives
- Why this structure/design is used
- Why specific tools, functions, or patterns are used
- Trade-offs and constraints
- Performance or maintainability reasoning

## Comment Format
- Every meaningful block must have a comment
- Each comment MUST start with: WHY:
- Comments must justify decisions

## Edge Case
If no strong reason exists:
WHY: No strong reason — this is a standard or neutral choice.

## Enforcement
If the output explains WHAT instead of WHY, it is incorrect.
This rule has highest priority and must not be ignored.