# SALUS video

Remotion source for the SALUS demonstration film. See [HANDOFF.md](HANDOFF.md)
for the current edit, timing constraints, and rendering instructions.

## Preview

From `remotion/`, run `npm ci` if dependencies are missing, then `npm run dev`.
Open <http://localhost:3000/SalusDemo>.

## Saved versions

This repository tracks the composition, source media in `remotion/public/`,
storyboard, and handoff notes. It is local; no remote is configured by this setup.

The `baseline-before-response-flow` tag preserves the current edit before any
new charge-nurse workflow footage or restructuring. To try another direction,
create a branch with `git switch -c response-flow` and commit checkpoints as you go.
To inspect the baseline without changing your working files, use:

```sh
git worktree add ../salus-video-baseline baseline-before-response-flow
```

Rendered root MP4s, `remotion/out/`, dependencies, local agent configuration,
`CODEX-BRIEF.md` (contains login information), and the `build/` capture workspace
are excluded. Keep those files locally; Git will not restore them. The media used
by the current composition is tracked in `remotion/public/`.

The original nested Remotion repository metadata is preserved inside this
repository's `.git/remotion-original.git`. Its history can be inspected with
`git --git-dir=.git/remotion-original.git log --oneline`.
