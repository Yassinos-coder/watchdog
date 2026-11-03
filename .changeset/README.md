# Changesets

A changeset is a small file describing a change and how big it is. Releases are built from them.

When your change affects people who use Watchdog, add one:

```bash
bunx changeset
```

Pick any package (all packages share one version), choose **patch** for fixes, **minor** for new features and **major** for breaking changes, and write one plain sentence about what changed. Commit the generated file with your change.

After it reaches `main`, the release workflow opens a **Release** pull request that bumps every version and updates the changelog. Merging that pull request publishes to npm and creates the GitHub release.
