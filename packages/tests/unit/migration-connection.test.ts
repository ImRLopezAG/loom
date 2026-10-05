import { expect, test, vi } from "vite-plus/test";
import pg from "pg";
import { withMigrationConnection } from "kello/tooling";

test("Neon migration URLs preserve certificate verification before connecting", async () => {
  const clients: pg.Client[] = [];
  const stopped = new Error("Connection intercepted before network access");
  const connect = vi.spyOn(pg.Client.prototype, "connect").mockImplementation(async function (this: pg.Client) {
    clients.push(this);
    throw stopped;
  });
  const operation = vi.fn(async () => undefined);
  try {
    for (const query of ["", "?sslmode=no-verify", "?sslmode=require&uselibpqcompat=true"]) {
      await expect(
        withMigrationConnection(`postgres://migrator:secret@ep-fixture.eu.neon.tech/db${query}`, operation),
      ).rejects.toBe(stopped);
      expect(clients.at(-1)?.ssl).toEqual({});
    }
    await expect(
      withMigrationConnection("postgres://migrator:secret@localhost/db?sslmode=no-verify", operation),
    ).rejects.toBe(stopped);
    expect(clients.at(-1)?.ssl).toEqual({ rejectUnauthorized: false });
    await expect(withMigrationConnection("https://ep-fixture.eu.neon.tech/db", operation)).rejects.toThrow(
      "Expected a PostgreSQL migration URL",
    );
    expect(clients).toHaveLength(4);
    expect(operation).not.toHaveBeenCalled();
  } finally {
    connect.mockRestore();
  }
});
