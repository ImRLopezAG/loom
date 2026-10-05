/**
 * Disposable local anon fixture: upstream Dalibo 2.5.1 for PostgreSQL 18, linux/amd64 only (emulated on arm64).
 * Build: `docker build --platform linux/amd64 -t loom-anon-2.5.1-pg18 -` with `dockerfile`, then run it bound to
 * 127.0.0.1 and `CREATE SCHEMA extensions; CREATE EXTENSION anon WITH SCHEMA extensions VERSION '2.5.1'`.
 * Neon's build is not reproducible from public sources; the differences below are observed, not assumed.
 */
export const anonLocalFixture = {
  container: "loom-anon-pg18-8ff1e0f4",
  image: "loom-anon-2.5.1-pg18",
  dockerfile: [
    "FROM --platform=linux/amd64 postgres:18",
    "ADD --checksum=sha256:9c3418063512b3c0958c51340d177f665404708310aed42fb1d7fa10301aac51 https://apt.dalibo.org/labs/pool/main/p/postgresql_anonymizer_18/postgresql_anonymizer_pg18-2.5.1.amd64.deb /tmp/anon.deb",
    "RUN dpkg -i /tmp/anon.deb && rm /tmp/anon.deb",
  ].join("\n"),
  serverVersion: "18.6 (Debian 18.6-1.pgdg13+2)",
  localDigest: "bf2495e00d054e29faa3c6f7aeb4017c75ec81b07d6472aef6efd28aa9678612",
  /** Neon-only members after the 4 symbolic RI identities already match: load_fake_data and int4 projection_to_oid. */
  onlyNeon: [
    "routine:anon.load_fake_data()",
    "routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)",
  ],
  onlyLocal: [
    "routine:anon.init(pg_catalog.text)",
    "routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int8)",
  ],
} as const;
