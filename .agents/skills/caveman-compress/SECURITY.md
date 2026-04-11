# Security

## Snyk High Risk Rating

`caveman-compress` receives a Snyk High Risk rating due to static analysis heuristics. This document explains what the skill does and does not do.

### What triggers the rating

1. **subprocess usage**: The skill calls the `opencode` CLI via `subprocess.run()`. The subprocess call uses a fixed argument list — no shell interpolation occurs. User-selected files are attached via explicit `--file` arguments, not interpolated into a shell command.

2. **File read/write**: The skill reads the file the user explicitly points it at, compresses it, and writes the result back to the same path. A `.original.md` backup is saved alongside it. No files outside the user-specified path are read or written.

### What the skill does NOT do

- Does not execute user file content as code
- Does not make network requests except through the user's configured `opencode` provider
- Does not access files outside the path the user provides
- Does not use shell=True or string interpolation in subprocess calls
- Does not collect or transmit any data beyond the file being compressed

### Auth behavior

The skill uses the local `opencode` CLI and whatever model/provider configuration the user has already set up there. Optional `CAVEMAN_MODEL` can override the model passed to `opencode run`.

### File size limit

Files larger than 500KB are rejected before any API call is made.

### Reporting a vulnerability

If you believe you've found a genuine security issue, please open a GitHub issue with the label `security`.
