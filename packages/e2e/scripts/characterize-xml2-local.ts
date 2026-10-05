import assert from "node:assert/strict";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { xml2Install } from "../fixtures/xml2";

// Local-only characterization: it reads a server file with pg_read_file, which needs superuser or
// pg_read_server_files, so it cannot run on managed providers. It is not a member of the canonical proof suite
// and records no gate. It proves the canonical denial targets are refused by policy rather than absent: the
// server's own PG_VERSION (relative to the data directory) is readable natively, yet xslt_process refuses it.
// Nothing is written to the server filesystem.
const profile = process.argv[2];
assert(profile === "local", "Usage: bun packages/e2e/scripts/characterize-xml2-local.ts local");
const ns = `"xml""2"`;
const reader = (select: string) =>
  `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:param name="p"/><xsl:template match="/"><o><xsl:value-of select="${select}"/></o></xsl:template></xsl:stylesheet>`;

await withExtensionDatabase(async (url) => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(xml2Install);
    const readable = await client.query<{ value: string }>("SELECT pg_read_file('PG_VERSION') AS value");
    assert.match(readable.rows[0]!.value, /^\d+\n$/);
    const denials = [
      [reader("count(document('PG_VERSION'))")],
      [reader("count(document('PG_VERSION'))"), "p=1"],
      [reader("count($p)"), "p=document('PG_VERSION')"],
    ];
    for (const args of denials) {
      const placeholders = args.map((_, index) => `$${index + 1}`).join(", ");
      await assert.rejects(
        client.query(`SELECT ${ns}.xslt_process('<r/>', ${placeholders})`, args),
        /failed to apply stylesheet/,
      );
    }
    console.log(
      JSON.stringify({
        scope: "xml2 local characterization, not a canonical gate",
        readableControl: "PG_VERSION",
        deniedArities: denials.length,
      }),
    );
  } finally {
    await client.end();
  }
});
