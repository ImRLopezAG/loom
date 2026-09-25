# TanStack Start + Loom

See the [setup and integration matrix](../README.md). This application demonstrates a typed server function, loader cache population, native Router/Query SSR integration, and explicit live subscriptions. Nitro builds a runnable Node 24 server.

Start with [the route](./src/routes/index.tsx), [the router](./src/router.tsx), and [the browser hooks](./src/components/notes.tsx). The server function returns typed finite data; Router's Query integration handles dehydration rather than passing an opaque cache through server-function serialization.
