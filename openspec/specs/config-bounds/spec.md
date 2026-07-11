# config-bounds Specification

## Purpose
Enforce Discord API limits and integer semantics for `apiBatchSize`.

## Requirements

### Requirement: Maximum batch size

The system MUST reject `apiBatchSize` values greater than `100`.

#### Scenario: apiBatchSize = 101

- GIVEN `apiBatchSize` is `101`
- WHEN `validateConfig` runs
- THEN it throws a `ConfigError`.

### Requirement: Integer-only semantics

The system MUST reject non-integer `apiBatchSize` values.

#### Scenario: apiBatchSize = 50.5

- GIVEN `apiBatchSize` is `50.5`
- WHEN `validateConfig` runs
- THEN it throws a `ConfigError`.
