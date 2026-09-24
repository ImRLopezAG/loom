# TanStack client integration research

Research date: September 23, 2026. This is a proposed optional integration, not an implemented API or a change to the framework acceptance scope.

## Recommendation

Use a TanStack DB custom collection adapter for record-list subscriptions. Offer TanStack Query options separately for arbitrary query results and request-driven applications. Keep the existing Loom transport and identity lifecycle underneath either integration. Neither library supplies Loom's PostgreSQL revisions, authorization, durable jobs or deployment protocol.

The [collection creator guide](https://tanstack.com/db/latest/docs/guides/collection-options-creator#complete-example-websocket-collection) explicitly supports backends with their own synchronization protocol. A creator provides collection configuration, feeds changes through `begin`, `write` and `commit`, signals initial readiness, and returns cleanup. This fits Loom's existing live-query store; opening another WebSocket inside the adapter would duplicate its connection, ticket and reconnect handling.

## Fit with today's Loom API

`packages/core/src/client/live.ts` provides a typed store with `getSnapshot` and `subscribe`. Successful snapshots contain the complete query result. The client scopes results to deployment, identity, function version and arguments, clears them on identity changes, and resubscribes after reconnect. Its results may be scalars, aggregates, objects or arrays; they are not necessarily database rows.

A proposed `loomCollectionOptions` should therefore accept a typed query reference, arguments and an explicit stable `getKey` for an array result. Each successful snapshot would be diffed against the adapter's last authoritative snapshot and applied atomically, including deletions. Use full-row replacement so removed optional fields do not linger. Duplicate keys must fail visibly. Keep separate collections for separate authorization/argument scopes; a filtered result cannot establish completeness of a whole table.

The collection must unsubscribe on disposal and invalidate identity-owned rows and pending writes before another identity can read them. Reconnect snapshots must remove rows deleted during disconnection. Startup failure must reject readiness; transient reconnect should preserve usable data only within the same identity. No optimistic overlay should leak into the authoritative snapshot comparison.

## Optimistic writes need a confirmation contract

TanStack DB supplies optimistic state and rollback. Its [mutation guide](https://tanstack.com/db/latest/docs/guides/mutations) explains that completion confirms backend state only if the mutation handler waits for confirmation or read-back. Named optimistic actions can express business operations instead of pretending every operation is generic CRUD. That is a good fit for Loom's named mutation functions.

Loom's current HTTP response and live-query store expose no shared commit receipt. WebSocket sequence numbers order one subscription; they are not PostgreSQL transaction IDs and cannot prove that a mutation is represented. The adapter must not drop an optimistic layer merely because `client.call` resolved. A follow-up implementation should first choose and test an explicit read-back barrier or a commit/revision receipt carried through both mutation and snapshot paths. Matching a returned row alone does not cover deletions, filtered queries or later concurrent updates.

The database assigns UUIDv7 IDs on insert. Optimistic insertion consequently also needs explicit temporary-to-authoritative ID reconciliation. Several client mutations are not automatically one backend transaction: atomic business operations must call a single Loom mutation that performs the corresponding SQL transaction.

Automatic optimistic updates are excluded from the current framework plan. This research does not silently add them to that delivery.

## Where TanStack Query fits

[TanStack Query optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) support a UI-based approach or explicit cache changes with cancellation, rollback and invalidation. Query options wrapping Loom's typed references would suit scalar results, aggregates, ordinary fetching and applications already using Query. An optional subscription bridge could update its cache, but would still own scope isolation, cleanup and stale-response ordering.

[TanStack DB's Query Collection](https://tanstack.com/db/latest/docs/collections/query-collection) already combines Query fetching with collections. It is useful for a request/refetch integration. A custom Loom collection is the more direct route when the application uses Loom's existing live subscription stream.

## Acceptance for a future adapter

- Typed list inference and explicit key selection; reject unsupported scalar results.
- Initial snapshot, update, deletion, empty result, filtered membership changes and duplicate-key errors.
- One shared Loom connection, subscription cleanup and reconnect after missed deletions.
- Logout and account switch while snapshots and optimistic writes are in flight.
- Overlapping mutations, rollback, server transformations and confirmation arriving before or after HTTP completion.
- Temporary IDs, deletion confirmation and concurrent server changes without a stale optimistic rollback.
- Browser-consumer packaging with optional TanStack dependencies and no server imports.

No dependency has been installed and no claim of adapter compatibility has been tested yet. The documentation example is architectural guidance, not a drop-in implementation for Loom's different wire protocol.
