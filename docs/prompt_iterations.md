# Prompt Iterations

## Lead Research Agent

| Test Case | Score | Issue | Fix Applied | Result |
|----------|------|------|------------|--------|
| St Xavier’s College | 4 | Generic pain points | Added: "Generate ONLY institution-specific pain points based on provided data. Do NOT use generic phrases." | Output became specific |
| Small coaching centre | 3 | Vague output | Added: "If data is limited, infer realistic small-scale operational challenges (e.g., manual processes, low digital adoption)." | More relevant output |
| New school no website | 3 | Missing fields | Added: "Do not leave fields empty. Provide best possible inferred values." | Reduced empty fields |
| Coaching institute | 3 | Repeated patterns | Added: "Ensure variation in pain points across different institutions." | Improved diversity |

---

## Email Personaliser

| Test Case | Score | Issue | Fix Applied | Result |
|----------|------|------|------------|--------|
| Narayana School | 4 | Generic tone | Added: "Use direct, personalised tone referencing institution name and pain points." | More engaging |
| Small coaching centre | 3 | Weak personalization | Added: "Explicitly mention institution type (school/college/coaching)." | Better targeting |
| Random institution | 2 | Off-topic | Added: "Ensure email directly addresses listed pain points." | Fixed relevance |
| New school | 3 | No urgency | Added: "Include urgency or action-driven language." | Improved conversion tone |

---

## Proposal Generator

| Test Case | Score | Issue | Fix Applied | Result |
|----------|------|------|------------|--------|
| College system | 4 | Generic modules | Added: "Proposed modules must be detailed, domain-specific, and solution-oriented." | Better modules |
| Small institute | 3 | Weak structure | Added: "Ensure structured sections: problem → solution → implementation." | Improved clarity |
| No input case | 2 | Vague output | Added fallback handling logic | Fixed |
| Coaching centre | 3 | Not scaled | Added: "Solutions must adapt based on institution size." | More realistic output |

---

## Key Learnings

- Generic prompts produce repetitive outputs
- Adding constraints significantly improves output quality
- Explicit instructions reduce hallucination
- Structure enforcement improves consistency
- Personalization rules greatly improve email effectiveness

---

## Final Result

- All agents produce structured, reliable output
- Minimal generic responses
- Improved personalization and clarity
- System is ready for integration