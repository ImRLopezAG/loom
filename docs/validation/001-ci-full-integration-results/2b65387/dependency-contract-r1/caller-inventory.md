# regular_bytes caller inventory

Inventory is source-derived from committed supervisor e5f42c9b at HEAD2b65387; line numbers refer to that unmodified source. Fourteen syntactic call sites (excluding the definition at176) were found. The proposal removes only the exact Turbo metadata subcall routed through check_pins.read; the generic wrapper remains strict for all other identities.

| Line | Caller / data | Existing bound | Proposed policy |
| --- | --- | --- | --- |
| 219 | tree_manifest regular entries: current dist, private dist backup, restored dist | 128 MiB per file; existing manifest count bound | nlink==1 unchanged; separately recorded symlink entries stay existing behavior |
| 1102 | inspect_config: checkout/e2e/app/home/XDG bunfig.toml | 65536 bytes | nlink==1 unchanged, including external config |
| 1128 | journal_receipt private supervisor journal | 1 MiB | nlink==1 unchanged |
| 1196 | publication_inventory each allowed output | 1 MiB; existing 80/12MiB aggregate | nlink==1 unchanged, repeated identity inventory unchanged |
| 1211 | static_marker dist JavaScript | 128 MiB/file, 256 MiB total, 20000 files | nlink==1 unchanged |
| 1223 | check_pins.read wrapper | 1 or 4 MiB at fixed sites | nlink==1 unchanged for every remaining read; exact Turbo package metadata leaves this wrapper |
| 1316 | main existing live source preimages | 1 MiB | nlink==1 unchanged |
| 1321 | main proposed overlay hash validation | 1 MiB | nlink==1 unchanged |
| 1332 | main private Bun/Node version stdout | 1000 bytes | nlink==1 unchanged |
| 1349 | main overlay bytes copied to live source | 1 MiB | nlink==1 unchanged |
| 1350 | main applied live source hash validation | 1 MiB | nlink==1 unchanged |
| 1369 | main private original integration console | 32 MiB | nlink==1 unchanged |
| 1416 | main restored source hashes | 1 MiB | nlink==1 unchanged |
| 1429 | main final source hash inventory | 1 MiB | nlink==1 unchanged |

## Indirect preflight reads through line1223

| Lines | Fixed identity group | Bound | Proposed policy |
| --- | --- | --- | --- |
| 1225 | consumed supervisor freeze | 1 MiB | nlink==1 |
| 1227 | supervisor self | 4 MiB | nlink==1 |
| 1228 | design freeze | 1 MiB | nlink==1 |
| 1233 | each of 29 consumed artifact pins, including overlays/archives/design | 4 MiB | nlink==1 |
| 1241 | six pinned input identities; actual workflow separately pinned | 1 MiB | nlink==1 |
| 1243–1244 | root and e2e package JSON | 1 MiB | nlink==1 |
| 1247–1248 | original and proposed Turbo task configuration | 1 MiB | nlink==1 |
| 1254 | exact installed node_modules/turbo/package.json | 1 MiB | ONLY exception: dedicated fixed reader with positive links and descriptor/byte stability checks |
| 1256 | overlay manifest | 1 MiB | nlink==1 |

## Other relevant readers / protections

source_path at202 separately refuses symlink leaf, escaping parent and existing nlink!=1; it is unchanged. tree_manifest's directory/link inventory semantics are unchanged, not widened by the metadata exception. read_traces at687 uses its own O_NOFOLLOW descriptor reader and expected/final identity, nlink==1 and byte-bound checks; trace_inventory at619 also requires nlink==1. These are not regular_bytes callers and remain strict. Publication has both its own lstat/link checks and strict regular_bytes. Git object/command output reads, proc reads and existing JSON/trace parsers are not routed through the new helper. No blanket dependency reader or general switch is proposed.
