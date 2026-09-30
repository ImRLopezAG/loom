# Search cache scope amendment

The user authorized the proposed search-specific runtime adapter on September 30 with “alright continue with this scope don't stop until finish,” following the explanation that it overrides inherited `initialData` and `placeholderData` defaults.

This amends the declaration-only constraint in KTD2/KTD13 of the relational search plan. Generated connections continue to use native oRPC clients and TanStack utilities, with a search-specific native utility plugin. The public method names remain `queryOptions`, `infiniteOptions`, and explicitly declared streaming `liveOptions`.

Search data defaults from global QueryClient configuration, key defaults, and scoped utility defaults are shadowed. Explicit per-call initial data must match the selection, including lazy initial data. Placeholder results incompatible with the current selection are omitted while fetching; valid placeholders remain supported. A new projection-specific callback wrapper prevents TanStack's same-callback optimization from reusing unchecked data. Other native options and ordinary procedures keep their upstream behavior.

The amendment authorizes the mechanism, not its acceptance. U1 still requires actual generated packed clients, positive compiler assertions, and native observer tests before dependent units begin. U2–U8 and hosted Neon acceptance remain outstanding.
