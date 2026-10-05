import assert from "node:assert/strict";

// Public regression fixtures, PostgreSQL License. No user keyring or encryption/decryption execution.
// Pinned PostgreSQL commit 37bbf5bba09c4244d74f152557e69f73f2b6690e.
// Extracted constants only from contrib/pgcrypto/sql/pgp-pubkey-decrypt.sql lines 19-618:
// sha256 0f7ad436127fd76db7dcd13e0e7e7205fb0107c6b30b3051daab6abff84ef8f9.
// Key IDs independently published in expected/pgp-info.out:
// sha256 38b5f9526252ab2e0f1b1518c9494e155bccd84e1074bca88cfa2f7f4cc9086d.
// Armor/header constants: sql/pgp-armor.sql, sha256
// 46c337a741fee459fea8e80738b00c47d5962dde4eff652d35b66fcf7653f65e;
// exact output oracle: expected/pgp-armor.out, sha256
// 45a086c23cc88d2868778bc2aad33cb36f6fbf338e21248bfad70a802a1b234c.
// Source URLs: https://github.com/postgres/postgres/tree/37bbf5bba09c4244d74f152557e69f73f2b6690e/contrib/pgcrypto

export const emptyArmor = "-----BEGIN PGP MESSAGE-----\n\n=twTO\n-----END PGP MESSAGE-----\n";
export const testArmor = "-----BEGIN PGP MESSAGE-----\n\ndGVzdA==\n=+G7Q\n-----END PGP MESSAGE-----\n";
export const duplicateHeadersArmor =
  "-----BEGIN PGP MESSAGE-----\nemptykey: \nlong: this value is more than \nemptykey: \nlong: 76 characters long, but it should still \nemptykey: \nlong: parse correctly as that's permitted by RFC 4880\nemptykey: \n\nem9va2E=\n=ZZZZ\n-----END PGP MESSAGE-----\n";
export const symmetricArmor =
  "-----BEGIN PGP MESSAGE-----\nComment: dat1.blowfish.sha1.mdc.s2k3.z0\n\njA0EBAMCfFNwxnvodX9g0jwB4n4s26/g5VmKzVab1bX1SmwY7gvgvlWdF3jKisvS\nyA6Ce1QTMK3KdL2MPfamsTUSAML8huCJMwYQFfE=\n=JcP+\n-----END PGP MESSAGE-----";
export const publicKeyArmor =
  "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1.4.1 (GNU/Linux)\n\nmQGiBELIIUgRBACp401L6jXrLB28c3YA4sM3OJKnxM1GT9YTkWyE3Vyte65H8WU9\ntGPBX7OMuaX5eGZ84LFUGvaP0k7anfmXcDkCO3P9GgL+ro/dS2Ps/vChQPZqHaxE\nxpKDUt47B7DGdRJrC8DRnIR4wbSyQA6ma3S1yFqC5pJhSs+mqf9eExOjiwCgntth\nklRxIYw352ZX9Ov9oht/p/ED/1Xi4PS+tkXVvyIw5aZfa61bT6XvDkoPI0Aj3GE5\nYmCHJlKA/IhEr8QJOLV++5VEv4l6KQ1/DFoJzoNdr1AGJukgTc6X/WcQRzfQtUic\nPHQme5oAWoHa6bVQZOwvbJh3mOXDq/Tk/KF22go8maM44vMn4bvv+SBbslviYLiL\njZJ1A/9JXF1esNq+X9HehJyqHHU7LEEf/ck6zC7o2erM3/LZlZuLNPD2cv3oL3Nv\nsaEgcTSZl+8XmO8pLmzjKIb+hi70qVx3t2IhMqbb4B/dMY1Ck62gPBKa81/Wwi7v\nIsEBQLEtyBmGmI64YpzoRNFeaaF9JY+sAKqROqe6dLjJ7vebQLQfRWxnYW1hbCAx\nMDI0IDx0ZXN0QGV4YW1wbGUub3JnPoheBBMRAgAeBQJCyCFIAhsDBgsJCAcDAgMV\nAgMDFgIBAh4BAheAAAoJEBwpvA0YF3NkOtsAniI9W2bC3CxARTpYrev7ihreDzFc\nAJ9WYLQxDQAi5Ec9AQoodPkIagzZ4LkBDQRCyCFKEAQAh5SNbbJMAsJ+sQbcWEzd\nku8AdYB5zY7Qyf9EOvn0g39bzANhxmmb6gbRlQN0ioymlDwraTKUAfuCZgNcg/0P\nsxFGb9nDcvjIV8qdVpnq1PuzMFuBbmGI6weg7Pj01dlPiO0wt1lLX+SubktqbYxI\n+h31c3RDZqxj+KAgxR8YNGMAAwYD+wQs2He1Z5+p4OSgMERiNzF0acZUYmc0e+/9\n6gfL0ft3IP+SSFo6hEBrkKVhZKoPSSRr5KpNaEobhdxsnKjUaw/qyoaFcNMzb4sF\nk8wq5UlCkR+h72u6hv8FuleCV8SJUT1U2JjtlXJR2Pey9ifh8rZfu57UbdwdHa0v\niWc4DilhiEkEGBECAAkFAkLIIUoCGwwACgkQHCm8DRgXc2TtrwCfdPom+HlNVE9F\nig3hGY1Rb4NEk1gAn1u9IuQB+BgDP40YHHz6bKWS/x80\n=RWci\n-----END PGP PUBLIC KEY BLOCK-----";
export const secretKeyArmor =
  "-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: GnuPG v1.4.1 (GNU/Linux)\n\nlQG7BELIIUgRBACp401L6jXrLB28c3YA4sM3OJKnxM1GT9YTkWyE3Vyte65H8WU9\ntGPBX7OMuaX5eGZ84LFUGvaP0k7anfmXcDkCO3P9GgL+ro/dS2Ps/vChQPZqHaxE\nxpKDUt47B7DGdRJrC8DRnIR4wbSyQA6ma3S1yFqC5pJhSs+mqf9eExOjiwCgntth\nklRxIYw352ZX9Ov9oht/p/ED/1Xi4PS+tkXVvyIw5aZfa61bT6XvDkoPI0Aj3GE5\nYmCHJlKA/IhEr8QJOLV++5VEv4l6KQ1/DFoJzoNdr1AGJukgTc6X/WcQRzfQtUic\nPHQme5oAWoHa6bVQZOwvbJh3mOXDq/Tk/KF22go8maM44vMn4bvv+SBbslviYLiL\njZJ1A/9JXF1esNq+X9HehJyqHHU7LEEf/ck6zC7o2erM3/LZlZuLNPD2cv3oL3Nv\nsaEgcTSZl+8XmO8pLmzjKIb+hi70qVx3t2IhMqbb4B/dMY1Ck62gPBKa81/Wwi7v\nIsEBQLEtyBmGmI64YpzoRNFeaaF9JY+sAKqROqe6dLjJ7vebQAAAnj4i4st+s+C6\nWKTIDcL1Iy0Saq8lCp60H0VsZ2FtYWwgMTAyNCA8dGVzdEBleGFtcGxlLm9yZz6I\nXgQTEQIAHgUCQsghSAIbAwYLCQgHAwIDFQIDAxYCAQIeAQIXgAAKCRAcKbwNGBdz\nZDrbAJ9cp6AsjOhiLxwznsMJheGf4xkH8wCfUPjMCLm4tAEnyYn2hDNt7CB8B6Kd\nATEEQsghShAEAIeUjW2yTALCfrEG3FhM3ZLvAHWAec2O0Mn/RDr59IN/W8wDYcZp\nm+oG0ZUDdIqMppQ8K2kylAH7gmYDXIP9D7MRRm/Zw3L4yFfKnVaZ6tT7szBbgW5h\niOsHoOz49NXZT4jtMLdZS1/krm5Lam2MSPod9XN0Q2asY/igIMUfGDRjAAMGA/sE\nLNh3tWefqeDkoDBEYjcxdGnGVGJnNHvv/eoHy9H7dyD/kkhaOoRAa5ClYWSqD0kk\na+SqTWhKG4XcbJyo1GsP6sqGhXDTM2+LBZPMKuVJQpEfoe9ruob/BbpXglfEiVE9\nVNiY7ZVyUdj3svYn4fK2X7ue1G3cHR2tL4lnOA4pYQAA9030E4u2ZKOfJBpUM+EM\nm9VmsGjaQZV4teB0R/q3W8sRIYhJBBgRAgAJBQJCyCFKAhsMAAoJEBwpvA0YF3Nk\n7a8AniFFotw1x2X+oryu3Q3nNtmxoKHpAJ9HU7jw7ydg33dI9J8gVkrmsSZ2/w==\n=nvqq\n-----END PGP PRIVATE KEY BLOCK-----";
export const signingOnlyKeyArmor =
  "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1.4.1 (GNU/Linux)\n\nmQELBELIJbEBCADAIdtcoLAmQfl8pb73pPRuEYx8qW9klLfCGG5A4OUOi00JHNwP\nZaABe1PGzjoeXrgM1MTQZhoZu1Vdg+KDI6XAtiy9P6bLg7ntsXksD4wBoIKtQKc2\n55pdukxTiu+xeJJG2q8ZZPOp97CV9fbQ9vPCwgnuSsDCoQlibZikDVPAyVTvp7Jx\n5rz8yXsl4sxvaeMZPqqFPtA/ENeQ3cpsyR1BQXSvoZpH1Fq0b8GcZTEdWWD/w6/K\nMCRC8TmgEd+z3e8kIsCwFQ+TSHbCcxRWdgZE7gE31sJHHVkrZlXtLU8MPXWqslVz\nR0cX+yC8j6bXI6/BqZ2SvRndJwuunRAr4um7AAYptB5SU0EgMjA0OCA8cnNhMjA0\nOEBleGFtcGxlLm9yZz6JATQEEwECAB4FAkLIJbECGwMGCwkIBwMCAxUCAwMWAgEC\nHgECF4AACgkQnc+OnJvTHyQqHwf8DtzuAGmObfe3ggtn14x2wnU1Nigebe1K5liR\nnrLuVlLBpdO6CWmMUzfKRvyZlx54GlA9uUQSjW+RlgejdOTQqesDrcTEukYd4yzw\nbLZyM5Gb3lsE/FEmE7Dxw/0Utf59uACqzG8LACQn9J6sEgZWKxAupuYTHXd12lDP\nD3dnU4uzKPhMcjnSN00pzjusP7C9NZd3OLkAx2vw/dmb4Q+/QxeZhVYYsAUuR2hv\n9bgGWopumlOkt8Zu5YG6+CtTbJXprPI7pJ1jHbeE+q/29hWJQtS8Abx82AcOkzhv\nS3NZKoJ/1DrGgoDAu1mGkM4KvLAxfDs/qQ9dZhtEmDbKPLTVEA==\n=lR4n\n-----END PGP PUBLIC KEY BLOCK-----";
export const recipientArmor =
  "-----BEGIN PGP MESSAGE-----\nVersion: GnuPG v1.4.1 (GNU/Linux)\n\nhQEOA9k2z2S7c/RmEAQAgVWW0DeLrZ+1thWJGBPp2WRFL9HeNqqWHbKJCXJbz1Uy\nfaUY7yxVvG5Eutmo+JMiY3mg23/DgVVXHQZsTWpGvGM6djgUNGKUjZDbW6Nog7Mr\ne78IywattCOmgUP9vIwwg3OVjuDCN/nVirGQFnXpJBc8DzWqDMWRWDy1M0ZsK7AD\n/2JTosSFxUdpON0DKtIY3GLzmh6Nk3iV0g8VgJKUBT1rhCXuMDj3snm//EMm7hTY\nPlnObq4mIhgz8NqprmhooxnU0Kapofb3P3wCHPpU14zxhXY8iKO/3JhBq2uFcx4X\nuBMwkW4AdNxY/mzJZELteTL8Tr0s7PISk+owb4URpG3n0jsBc0CVULxrjh5Ejkdw\nwCM195J6+KbQxOOFQ0b3uOVvv4dEgd/hRERCOq5EPaFhlHegyYJ7YO842vnSDA==\n=PABx\n-----END PGP MESSAGE-----";
export const secondRecipientArmor =
  "-----BEGIN PGP MESSAGE-----\nVersion: GnuPG v1.4.1 (GNU/Linux)\n\nhQIOAywibh/+XMfUEAf+OINhBngEsw4a/IJIeJvUgv1gTQzBwOdQEuc/runr4Oa8\nSkw/Bj0X/zgABVZLem1a35NHaNwaQaCFwMQ41YyWCu+jTdsiyX/Nw0w8LKKz0rNC\nvVpG6YuV7Turtsf8a5lXy1K0SHkLlgxQ6c76GS4gtSl5+bsL2+5R1gSRJ9NXqCQP\nOHRipEiYwBPqr5R21ZG0FXXNKGOGkj6jt/M/wh3WVtAhYuBI+HPKRfAEjd/Pu/eD\ne1zYtkH1dKKFmp44+nF0tTI274xpuso7ShfKYrOK3saFWrl0DWiWteUinjSA1YBY\nm7dG7NZ8PW+g1SZWhEoPjEEEHz3kWMvlKheMRDudnQf/dDyX6kZVIAQF/5B012hq\nQyVewgTGysowFIDn01uIewoEA9cASw699jw9IoJp+k5WZXnU+INllBLzQxniQCSu\niEcr0x3fYqNtj9QBfbIqyRcY6HTWcmzyOUeGaSyX76j+tRAvtVtXpraFFFnaHB70\nYpXTjLkp8EBafzMghFaKDeXlr2TG/T7rbwcwWrFIwPqEAUKWN5m97Q3eyo8/ioMd\nYoFD64J9ovSsgbuU5IpIGAsjxK+NKzg/2STH7zZFEVCtgcIXsTHTZfiwS98/+1H9\np1DIDaXIcUFV2ztmcKxh9gt2sXRz1W+x6D8O0k3nanU5yGG4miLKaq18fbcA0BD1\n+NIzAfelq6nvvxYKcGcamBMgLo5JkZOBHvyr6RsAKIT5QYc0QTjysTk9l0Am3gYc\nG2pAE+3k\n=TBHV\n-----END PGP MESSAGE-----";
export const publicKeyId = "D936CF64BB73F466";
export const secondRecipientId = "2C226E1FFE5CC7D4";
export const duplicateHeaders = [
  { key: "emptykey", value: "" },
  { key: "long", value: "this value is more than " },
  { key: "emptykey", value: "" },
  { key: "long", value: "76 characters long, but it should still " },
  { key: "emptykey", value: "" },
  { key: "long", value: "parse correctly as that's permitted by RFC 4880" },
  { key: "emptykey", value: "" },
];

/** Independent fixture Base64 extraction; never calls the adapter being tested. */
export function fixtureBytes(armored: string) {
  const payload = armored.split(/\r?\n\r?\n/)[1]?.split(/\r?\n=/)[0];
  assert(payload);
  return { hex: Buffer.from(payload.replaceAll(/\s/g, ""), "base64").toString("hex") };
}

/** Read the captured old-format PKESK packet framing and independently pin its recipient bytes. */
export function recipientPacket(armored: string, expectedId: string) {
  const bytes = Buffer.from(fixtureBytes(armored).hex, "hex");
  assert.equal(bytes[0], 0x85); // Old-format tag 1, two-octet length.
  const length = bytes.readUInt16BE(1);
  assert.equal(bytes[3], 3); // Captured PKESK version.
  assert.equal(bytes.subarray(4, 12).toString("hex").toUpperCase(), expectedId);
  assert(bytes.length >= length + 3);
  return { bytes, packet: bytes.subarray(0, length + 3), idOffset: 4 };
}

/** Metadata mutation only: this is not authenticated ciphertext or an encryption oracle. */
export function anyKeyBytes() {
  const { bytes, idOffset } = recipientPacket(recipientArmor, publicKeyId);
  bytes.fill(0, idOffset, idOffset + 8);
  return { hex: bytes.toString("hex") };
}

export function multipleRecipientBytes() {
  const first = recipientPacket(recipientArmor, publicKeyId);
  const second = recipientPacket(secondRecipientArmor, secondRecipientId);
  return { hex: Buffer.concat([first.packet, second.bytes]).toString("hex") };
}

/** Test-only RFC 4880 CRC24/Base64 framing, independent of SQL and application code. */
export function independentArmor(bytes: Buffer) {
  let crc = 0xb704ce;
  for (const byte of bytes) {
    crc ^= byte << 16;
    for (let bit = 0; bit < 8; bit++) {
      crc <<= 1;
      if (crc & 0x1000000) crc ^= 0x1864cfb;
    }
  }
  const checksum = Buffer.from([(crc >> 16) & 255, (crc >> 8) & 255, crc & 255]).toString("base64");
  const payload =
    bytes
      .toString("base64")
      .match(/.{1,76}/g)
      ?.join("\n") ?? "";
  return `-----BEGIN PGP MESSAGE-----\n\n${payload ? `${payload}\n` : ""}=${checksum}\n-----END PGP MESSAGE-----\n`;
}
