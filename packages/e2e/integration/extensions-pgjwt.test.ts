import { expect } from "bun:test";
import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { jsonDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { withPgJwtApi, pgJwtNamespace, pgJwtSchema } from "../fixtures/pgjwt-api";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgJwtRoutineProofCase, pgJwtTimeProofCase } from "../fixtures/pgjwt-proof-cases";

const secret = "disposable-jwt-fixture-secret";
const payloadText = '{ "id": 9007199254740993, "duplicate": 1, "duplicate": 2, "unicode": "日本" }';
function signedToken(header: string, payload: string, algorithm: "sha256" | "sha384" | "sha512") {
  const signables = `${Buffer.from(header).toString("base64url")}.${Buffer.from(payload).toString("base64url")}`;
  return `${signables}.${createHmac(algorithm, secret).update(signables).digest("base64url")}`;
}

extensionProofTest(
  pgJwtRoutineProofCase,
  async () => {
    await withPgJwtApi(async ({ url, api, client, connection }) => {
      await observeExtensionProofDatabase(url, pgJwtRoutineProofCase.id, "pgjwt");
      const document = jsonDocument(payloadText);
      for (const [algorithm, digest] of [
        ["HS256", "sha256"],
        ["HS384", "sha384"],
        ["HS512", "sha512"],
      ] as const) {
        const expectedToken = signedToken(`{"alg":"${algorithm}","typ":"JWT"}`, payloadText, digest);
        const values = await connection.transaction((db) =>
          db
            .select({
              token: api.sign(document, secret, algorithm),
              signature: api.algorithmSign("header.payload", secret, algorithm),
              encoded: api.urlEncode({ hex: "00ff5c" }),
              decoded: api.urlDecode(Buffer.from("00ff5c", "hex").toString("base64url")),
              number: api.tryCastDouble("123.25"),
              invalid: api.tryCastDouble("not a number"),
              nan: api.tryCastDouble("NaN"),
              infinity: api.tryCastDouble("Infinity"),
              negativeInfinity: api.tryCastDouble("-Infinity"),
            })
            .from(sql`(values (1)) as fixture(value)`),
        );
        expect(values).toEqual([
          {
            token: expectedToken,
            signature: createHmac(digest, secret).update("header.payload").digest("base64url"),
            encoded: Buffer.from("00ff5c", "hex").toString("base64url"),
            decoded: { hex: "00ff5c" },
            number: 123.25,
            invalid: null,
            nan: { nonfinite: "NaN" },
            infinity: { nonfinite: "Infinity" },
            negativeInfinity: { nonfinite: "-Infinity" },
          },
        ]);
        const rows = api.verify(expectedToken, secret, "verified", algorithm);
        const verified = await connection.transaction((db) =>
          db
            .select({
              header: rows.header,
              payload: rows.payload,
              valid: rows.valid,
            })
            .from(rows.from),
        );
        expect(verified).toEqual([
          {
            header: jsonDocument(`{"alg":"${algorithm}","typ":"JWT"}`),
            payload: document,
            valid: true,
          },
        ]);
        const native = await client.query<{ header: string; payload: string; valid: boolean }>(
          `select header::text, payload::text, valid from ${pgJwtNamespace}.verify($1,$2,$3)`,
          [expectedToken, secret, algorithm],
        );
        expect(native.rows).toEqual([{ header: verified[0]!.header!.text, payload: payloadText, valid: true }]);
        if (algorithm === "HS256") {
          const assertions = {
            algorithm_sign: () =>
              expect(values[0]!.signature).toBe(
                createHmac("sha256", secret).update("header.payload").digest("base64url"),
              ),
            sign: () => expect(values[0]!.token).toBe(expectedToken),
            try_cast_double: () => expect(values[0]!.number).toBe(123.25),
            url_decode: () => expect(values[0]!.decoded).toEqual({ hex: "00ff5c" }),
            url_encode: () => expect(values[0]!.encoded).toBe(Buffer.from("00ff5c", "hex").toString("base64url")),
            verify: () =>
              expect(verified).toEqual([
                { header: jsonDocument('{"alg":"HS256","typ":"JWT"}'), payload: document, valid: true },
              ]),
          };
          for (const [name, assertion] of Object.entries(assertions)) {
            const claim = pgJwtRoutineProofCase.claims.find((entry) => entry.member.includes(`.${name}(`));
            if (!claim) throw new Error("Missing exact JWT native claim");
            await extensionProofWitness({ ...claim, schema: pgJwtSchema }, assertion);
          }
        }
      }
      const defaults = await connection.transaction((db) =>
        db
          .select({
            token: api.sign(document, secret),
            encodedNull: api.urlEncode(null),
            decodedNull: api.urlDecode(null),
            signedNull: api.sign(null, secret),
            algorithmNull: api.algorithmSign(null, secret, "HS256"),
            numberNull: api.tryCastDouble(null),
          })
          .from(sql`(values (1)) as fixture(value)`),
      );
      expect(defaults).toEqual([
        {
          token: signedToken('{"alg":"HS256","typ":"JWT"}', payloadText, "sha256"),
          encodedNull: null,
          decodedNull: null,
          signedNull: null,
          algorithmNull: null,
          numberNull: null,
        },
      ]);
      const nullRows = api.verify(null, null, "nullable");
      expect(
        await connection.transaction((db) =>
          db
            .select({
              header: nullRows.header,
              payload: nullRows.payload,
              valid: nullRows.valid,
            })
            .from(nullRows.from),
        ),
      ).toEqual([{ header: null, payload: null, valid: null }]);
    });
  },
  90_000,
);

extensionProofTest(
  pgJwtTimeProofCase,
  async () => {
    await withPgJwtApi(async ({ url, api, connection }) => {
      await observeExtensionProofDatabase(url, pgJwtTimeProofCase.id, "pgjwt");
      await extensionProofWitness({ ...pgJwtTimeProofCase.claims[0]!, schema: pgJwtSchema }, async () => {
        // Header labels are data: the native function uses the caller's algorithm argument.
        const token = signedToken('{"alg":"ignored-label","typ":"JWT"}', "{}", "sha256");
        const verified = api.verify(token, secret, "verified");
        const mismatched = api.verify(token, "wrong-secret", "mismatched");
        expect(await connection.transaction((db) => db.select({ valid: verified.valid }).from(verified.from))).toEqual([
          { valid: true },
        ]);
        expect(
          await connection.transaction((db) => db.select({ valid: mismatched.valid }).from(mismatched.from)),
        ).toEqual([{ valid: false }]);
        const expired = api.verify(signedToken('{"alg":"HS256"}', '{"exp":0}', "sha256"), secret, "expired");
        const future = api.verify(signedToken('{"alg":"HS256"}', '{"nbf":4102444800}', "sha256"), secret, "future");
        expect(await connection.transaction((db) => db.select({ valid: expired.valid }).from(expired.from))).toEqual([
          { valid: false },
        ]);
        expect(await connection.transaction((db) => db.select({ valid: future.valid }).from(future.from))).toEqual([
          { valid: false },
        ]);
        // Malformed token JSON remains PostgreSQL's diagnostic, rather than becoming a successful empty result.
        const malformed = api.verify("invalid", secret, "malformed");
        await expect(
          connection.transaction((db) =>
            db
              .select({ header: malformed.header, payload: malformed.payload, valid: malformed.valid })
              .from(malformed.from),
          ),
        ).rejects.toThrow();
      });
    });
  },
  90_000,
);
