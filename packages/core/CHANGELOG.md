# @watchdog-sdk/core

## 0.4.4

### Patch Changes

- Updated build and release tooling: Bun 1.4.4, newer Docker and checkout GitHub Actions, jsdom 30 and recharts 3.10

## 0.4.3

### Patch Changes

- The release workflow no longer prints scary-looking npm 404 messages when it checks whether a version is already published

## 0.4.2

### Patch Changes

- Releases are now automated: a pull request bumps every version and writes the changelog, and merging it publishes the packages to npm with provenance, creates a GitHub release and pushes the Docker image
