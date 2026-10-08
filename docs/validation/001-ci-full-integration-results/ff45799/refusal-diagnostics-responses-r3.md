# Refusal diagnostics R3 response and source freeze

R2 is retained as **NOT APPROVED, one P2**, receipt SHA-256 `050736027e2b58834296da5e65adffc7782aefbbed6f1ac03b429d25890aec1a`. R1 remains cancelled with unknown cause, interim commentary only, absent verdict receipt (ENOENT), and no inferred approval.

The rejected supervisor `8c935e5f...` and consumed freeze `e9952284...` were archived byte-exact as `linux-full-integration-refusal-rejected-r2.py` and `supervisor-freeze-refusal-rejected-r2.json`. The unchanged original eight-pin document and full R2 receipt also have immutable copies: `refusal-diagnostics-eight-pins-rejected-r2.json` and `refusal-diagnostics-review-r2-preserved.md`. Their original files remain unchanged.

## P2 response

On the existing descriptor predicate failure, the caller now changes the existing report status container's existing `status` entry to the literal `unavailable`. It does not construct a new fallback dictionary. The report container and key are established before `check_pins`; a failed read exits that preflight path immediately. The whole optional operation, including starred argument assembly and function entry, is inside caller-side `try/except Exception`. The unchanged primary `require(valid, "file_type_or_bound")` follows that containment block. Recoverable optional diagnostic failure therefore cannot bypass that primary refusal through the former invocation gap.

The recorder no longer allocates the initial fallback. It still validates fixed identities and descriptor integers, constructs bounded fixed-field detail, serializes it within 1024 bytes, and only then replaces the report field with observed detail. Its internal containment is retained. This addresses the specific recoverable allocation boundaries identified in R2; it does not promise survival or publication under irrecoverable resource exhaustion or failures in existing primary exception machinery.

Only the optional recording block/comment and the consumed freeze's `supervisorSha256` change. Descriptor checks/order, source/hash/ancestry/workflow/backend/graph/deadlines/cache/resource/process/restoration/publication limits are unchanged. The new exact correction patch is `refusal-diagnostics-correction-r3.patch`; it compares against the immutable rejected R2 bytes, not against a reconstructed revision.

Parent read the complete correction diff and recorder/caller/preflight/report initialization/primary handler/publication interactions. Source-only byte/hash/JSON operations authored the archive and metadata; the supervisor was not imported, compiled, syntax-checked or executed. No runtime/tests/build/DB/probes/install/dependency writes, workflow changes, commits, pushes or CI retries occurred.

Both ff45799 `file_type_or_bound` preflight failures remain preserved. No descriptor cause is established. Hardlinked Turbo metadata remains only a hypothesis. Original workload never ran; no-application `restored:true` and empty preflight direct-child audit are not restoration/descendant acceptance. All earlier CI reds, named skips, cancelled R1 and previous supervisor review findings/responses remain applicable history. Linux execution, ownership, full lineage and publication remain unverified. Exactly one fresh independent full-history Astra-low R3 SOURCE review is required; this response does not approve itself or authorize remote execution.
