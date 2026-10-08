# OpenSpec

This folder holds the behavior specs for `discord-channel-dump` and the history of the changes that shaped them. Specs describe what the code must do; when a spec and the code disagree, the code wins and the spec gets updated.

## Layout

| Path | Contents |
|------|----------|
| `config.yaml` | Project context, testing commands, and per-phase rules for spec-driven work. |
| `specs/` | Current source-of-truth specs, one capability per folder (`specs/<capability>/spec.md`). |
| `changes/archive/` | Completed changes, one dated folder each (`YYYY-MM-DD-<change>/`). |
| `reviews/` | Project quality reviews. Some of them are written in Spanish. |

An archived change folder usually contains `proposal.md`, `design.md`, and `tasks.md`, plus reports such as `exploration.md`, `verify-report.md`, and `archive-report.md`. Not every change has every file.

## How a change flows

1. **Propose**: describe the intent, scope, and approach in `proposal.md`.
2. **Spec**: write the requirements and Given/When/Then scenarios that change.
3. **Design**: record the technical approach and decisions in `design.md`.
4. **Tasks**: break the work into a checklist in `tasks.md`.
5. **Apply**: implement the tasks, with tests.
6. **Verify**: check the implementation against the specs and tasks.
7. **Archive**: merge the spec changes into `specs/` and move the change folder to `changes/archive/`.

## Keeping specs honest

- Specs describe observable behavior, and that behavior must match the code.
- When a spec drifts from the code, update the spec to match the code.
- Spec scenarios use Given/When/Then and RFC 2119 keywords (`MUST`, `SHALL`, `SHOULD`, `MAY`), as `config.yaml` requires.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the issue and pull request workflow.
