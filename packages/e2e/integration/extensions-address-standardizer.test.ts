import assert from "node:assert/strict";
import pg from "pg";
import { createAddressStandardizer_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/address-standardizer";
import { ADDRESS_STANDARDIZER_DIGEST } from "../fixtures/address-standardizer-proof-cases";
import { addressStandardizerTypeIoProofCase } from "../fixtures/address-standardizer-proof-cases";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";

const descriptor = {
  name: "address_standardizer",
  version: "3.6.4",
  schema: 'Addr"日本',
  apiSupport: { status: "verified", digest: ADDRESS_STANDARDIZER_DIGEST },
} as const;

const stdaddrAttributes = `building text, house_num text, predir text, qual text, pretype text, name text, suftype text, sufdir text, ruralroute text, extra text, city text, state text, country text, postcode text, box text, unit text`;

extensionProofTest(addressStandardizerTypeIoProofCase, async () => {
  const api = createAddressStandardizer_3_6_4(descriptor);
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const schema = pg.escapeIdentifier(descriptor.schema);
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`CREATE TYPE ${schema}.stdaddr AS (${stdaddrAttributes})`);
      const unicode = {
        building: null,
        house_num: "123",
        predir: null,
        qual: null,
        pretype: null,
        name: 'Main "通り"',
        suftype: "ST",
        sufdir: null,
        ruralroute: null,
        extra: "a\\b",
        city: "東京",
        state: null,
        country: null,
        postcode: null,
        box: null,
        unit: "",
      };
      const empty = {
        building: null,
        house_num: null,
        predir: null,
        qual: null,
        pretype: null,
        name: null,
        suftype: null,
        sufdir: null,
        ruralroute: null,
        extra: null,
        city: null,
        state: null,
        country: null,
        postcode: null,
        box: null,
        unit: null,
      };
      for (const claim of addressStandardizerTypeIoProofCase.claims) {
        await extensionProofWitness({ ...claim, schema: descriptor.schema }, async () => {
          if (claim.member.endsWith("._stdaddr")) {
            const encoded = api.arrayCodec.encode({
              dimensions: [{ lowerBound: 1, length: 2 }],
              values: [unicode, null],
            });
            const native = await client.query<{ value: string }>(
              `SELECT $1::${schema}.stdaddr[]::text AS value`,
              [encoded],
            );
            assert.deepEqual(api.arrayCodec.decode(native.rows[0]!.value), {
              dimensions: [{ lowerBound: 1, length: 2 }],
              values: [unicode, null],
            });
            return;
          }
          const encoded = api.codec.encode(unicode);
          const native = await client.query<{ value: string; empty: string }>(
            `SELECT $1::${schema}.stdaddr::text AS value, $2::${schema}.stdaddr::text AS empty`,
            [encoded, api.codec.encode(empty)],
          );
          assert.deepEqual(api.codec.decode(native.rows[0]!.value), unicode);
          assert.deepEqual(api.codec.decode(native.rows[0]!.empty), empty);
        });
      }
    } finally {
      await client.end();
    }
  });
});
