# OpenSpec

This folder holds the behavior specs for `discord-channel-dump`. Specs describe what the code must do; when a spec and the code disagree, the code wins and the spec gets updated.

## Layout

| Path | Contents |
|------|----------|
| `specs/` | Current source-of-truth specs, one capability per folder (`specs/<capability>/spec.md`). |
| `config.yaml` | Project context, testing commands, and writing rules for specs. |

## Proposing a change

Changes start as an issue and land through a pull request, as described in [CONTRIBUTING.md](../CONTRIBUTING.md). If a change alters observable behavior, update the matching spec in the same pull request.

## Keeping specs honest

- Specs describe observable behavior, and that behavior must match the code.
- When a spec drifts from the code, update the spec to match the code.
- Spec scenarios use Given/When/Then and RFC 2119 keywords (`MUST`, `SHALL`, `SHOULD`, `MAY`), as `config.yaml` requires.
