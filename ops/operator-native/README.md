# Native command scheduling

These optional systemd templates invoke the upstream CLI directly. They implement no custom import, ranking, mutation, checkpoint, locking or success rules.

For each explicitly approved local source, `gbrain-sync@SOURCE.timer` runs sync, stale embedding backfill and deterministic stale link/timeline extraction. Sync does not pull remote Git history, admits reviewed working-tree changes, and defers embeddings/extraction to the next two native commands. A failed command stops that run. The timer waits five minutes after completion, so long initial catch-up does not stack runs. `gbrain-sweep@SOURCE.timer` provides a bounded recent-page backstop.

Prerequisites: the installed native CLI, a provider-aware environment launcher at `/usr/local/bin/gbrain`, valid source registration and canonical writer ownership, database/schema readiness, and an existing jobs supervisor when managed persistence is enabled. Set source IDs, intervals and resource limits for the deployment. Do not enable disconnected connector sources blindly. Review allowed working-tree files before admission. Archive old schedulers before enabling these templates.

For an authenticated connector source, `gbrain-connector-sync@SOURCE.timer` runs native connector sync followed by stale embedding and deterministic extraction. It waits fifteen minutes after completion and does not pass Git working-tree options. Confirm the account through the provider before enablement, preserve connector checkpoints, and grant only the intended services. Native credential vaults and connector clones belong in the encrypted recovery backup; credentials must never enter this repository. Enable only one sync timer per source.

`backup-connector-control-plane.patch` extends an existing encrypted offsite backup script to include the connector units, native vault and connector clones. Verify it against the deployed script before applying; this is a control-plane backup extension, not a replacement database exporter. Keep generation directories private and encrypt the archive before remote upload. Verify archive membership after a real backup.

Validate the templates with `systemd-analyze verify` and verify two actual timer-fired cycles. Acceptance includes canonical readback after a changed file, stale non-null embeddings, source-scoped same-slug handling, write receipts and absence of failed cursors. A green service exit is not an entire-corpus quality claim. Read-only doctor diagnostics remain the upstream health authority; configured cloud providers may receive the text they process.

Autopilot is an alternative scheduler, not an additional one. Its default cycle can pull Git and run wider phases. These templates deliberately keep the command sequence explicit. They do not enable paid enrichment, conversation capture, private external decision models or destructive consolidation.

The optional `gbrain-agent-mcp.service.d/owner-private-reads.conf` drop-in enables upstream private-page reads on an owner-authenticated loopback MCP service. Install it only where the existing operator access is intended to include private knowledge; keep it off general/public endpoints. It does not modify grants or page visibility. Verify a private canonical read through the owner connection and continued exclusion on the public endpoint.
