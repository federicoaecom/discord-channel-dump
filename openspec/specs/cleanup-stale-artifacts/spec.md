# Cleanup Stale Artifacts Specification

## Purpose

Remove stale output files, unused assets, local tooling indexes, and internal process artifacts from the workspace while preserving runtime data directories.

## Requirements

### Requirement: Stale Output Files Removed

The system MUST delete all `*_output.txt` files created by previous verification runs (`format_output.txt`, `help_output.txt`, `lint_output.txt`, `test_output.txt`).

#### Scenario: Stale output files are present in the workspace

- GIVEN the workspace root contains `format_output.txt`, `help_output.txt`, `lint_output.txt`, and `test_output.txt`
- WHEN the cleanup capability is applied
- THEN none of those files remain in the workspace

### Requirement: Unused Assets Removed

The system MUST delete the `logo.png` asset because it is not referenced by the application, tests, or documentation.

#### Scenario: Unused logo exists at the workspace root

- GIVEN `logo.png` exists in the workspace root
- WHEN the cleanup capability is applied
- THEN `logo.png` is removed from the workspace

### Requirement: Generated and Local Directories Removed

The system MUST delete generated and local tooling directories: `node_modules/` and local tool cache directories.

#### Scenario: Generated directories are present in the workspace

- GIVEN `node_modules/` and local tool cache directories exist in the workspace
- WHEN the cleanup capability is applied
- THEN those directories are removed from the workspace

### Requirement: Internal Process Artifacts Removed

The `openspec/` folder MUST contain only the behavior specs (`specs/`), `config.yaml`, and `README.md`. Change-proposal history (`openspec/changes/`) and internal quality reviews (`openspec/reviews/`) MUST NOT be present.

#### Scenario: Internal process artifacts exist in openspec

- GIVEN `openspec/changes/` or `openspec/reviews/` exists in the workspace
- WHEN the cleanup capability is applied
- THEN neither directory is present
- AND `openspec/specs/`, `openspec/config.yaml`, and `openspec/README.md` remain

### Requirement: Runtime Data Directories Preserved

The system MUST NOT delete, move, or modify the `backups/` and `browser-profile/` runtime data directories.

#### Scenario: Runtime directories exist alongside stale artifacts

- GIVEN `backups/` and `browser-profile/` exist and contain data
- AND stale artifacts are also present
- WHEN the cleanup capability is applied
- THEN `backups/` and `browser-profile/` remain in place with their contents intact

### Requirement: Cleanup Verification

The system MUST verify that the workspace root contains only authored project files, configuration, documentation, `openspec/`, and the preserved runtime directories.

#### Scenario: Verification after cleanup

- GIVEN cleanup has been applied
- WHEN a workspace inventory is taken
- THEN the root contains `bin/`, `src/`, `test/`, `package.json`, `package-lock.json`, `.eslintrc.json`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.github/`, `README.md`, `AGENTS.md`, `LICENSE`, `openspec/`, `backups/`, and `browser-profile/`
- AND no stale output files, unused assets, generated directories, or internal process artifacts remain
