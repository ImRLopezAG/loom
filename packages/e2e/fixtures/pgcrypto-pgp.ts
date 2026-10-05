import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
export {
  fixtureBytes,
  publicKeyArmor,
  secretKeyArmor,
  recipientArmor,
  signingOnlyKeyArmor,
} from "./pgcrypto-formatting";

// Public regression constants from PostgreSQL commit 37bbf5bba09c4244d74f152557e69f73f2b6690e.
// contrib/pgcrypto/sql/pgp-pubkey-decrypt.sql SHA256:
// 0f7ad436127fd76db7dcd13e0e7e7205fb0107c6b30b3051daab6abff84ef8f9.
// expected/pgp-pubkey-decrypt.out SHA256:
// 727c081482a15765341158ed063b22c426c24cc3e39a437cd2b5275adef94fa2.
// https://github.com/postgres/postgres/blob/37bbf5bba09c4244d74f152557e69f73f2b6690e/contrib/pgcrypto/sql/pgp-pubkey-decrypt.sql
// keytbl id5 is the password-protected version of the id1 published ElGamal key.
export const protectedSecretKeyArmor = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: GnuPG v1.4.1 (GNU/Linux)

lQHpBELIIUgRBACp401L6jXrLB28c3YA4sM3OJKnxM1GT9YTkWyE3Vyte65H8WU9
tGPBX7OMuaX5eGZ84LFUGvaP0k7anfmXcDkCO3P9GgL+ro/dS2Ps/vChQPZqHaxE
xpKDUt47B7DGdRJrC8DRnIR4wbSyQA6ma3S1yFqC5pJhSs+mqf9eExOjiwCgntth
klRxIYw352ZX9Ov9oht/p/ED/1Xi4PS+tkXVvyIw5aZfa61bT6XvDkoPI0Aj3GE5
YmCHJlKA/IhEr8QJOLV++5VEv4l6KQ1/DFoJzoNdr1AGJukgTc6X/WcQRzfQtUic
PHQme5oAWoHa6bVQZOwvbJh3mOXDq/Tk/KF22go8maM44vMn4bvv+SBbslviYLiL
jZJ1A/9JXF1esNq+X9HehJyqHHU7LEEf/ck6zC7o2erM3/LZlZuLNPD2cv3oL3Nv
saEgcTSZl+8XmO8pLmzjKIb+hi70qVx3t2IhMqbb4B/dMY1Ck62gPBKa81/Wwi7v
IsEBQLEtyBmGmI64YpzoRNFeaaF9JY+sAKqROqe6dLjJ7vebQP4HAwImKZ5q2QwT
D2DDAY/IQBjes7WgqZeacfLPDoB8ecD/KLoSCH6Z3etvbPHSOKiazxoJ962Ix74H
ZAE6ZbMTtl5dZW1ptB9FbGdhbWFsIDEwMjQgPHRlc3RAZXhhbXBsZS5vcmc+iF4E
ExECAB4FAkLIIUgCGwMGCwkIBwMCAxUCAwMWAgECHgECF4AACgkQHCm8DRgXc2Q6
2wCfXKegLIzoYi8cM57DCYXhn+MZB/MAn1D4zAi5uLQBJ8mJ9oQzbewgfAeinQFf
BELIIUoQBACHlI1tskwCwn6xBtxYTN2S7wB1gHnNjtDJ/0Q6+fSDf1vMA2HGaZvq
BtGVA3SKjKaUPCtpMpQB+4JmA1yD/Q+zEUZv2cNy+MhXyp1WmerU+7MwW4FuYYjr
B6Ds+PTV2U+I7TC3WUtf5K5uS2ptjEj6HfVzdENmrGP4oCDFHxg0YwADBgP7BCzY
d7Vnn6ng5KAwRGI3MXRpxlRiZzR77/3qB8vR+3cg/5JIWjqEQGuQpWFkqg9JJGvk
qk1oShuF3GycqNRrD+rKhoVw0zNviwWTzCrlSUKRH6Hva7qG/wW6V4JXxIlRPVTY
mO2VclHY97L2J+Hytl+7ntRt3B0drS+JZzgOKWH+BwMCJimeatkMEw9gRkFjt4Xa
9rX8awMBE5+vVcGKv/DNiCvJnlYvSdCj8VfuHsYFliiJo6u17NJon+K43e3yvDNk
f631VOVanGEz7TyqOkWQiEkEGBECAAkFAkLIIUoCGwwACgkQHCm8DRgXc2TtrwCe
IUWi3DXHZf6ivK7dDec22bGgoekAn0dTuPDvJ2Dfd0j0nyBWSuaxJnb/
=SNvr
-----END PGP PRIVATE KEY BLOCK-----`;
export const faultyCipherArmor = `-----BEGIN PGP MESSAGE-----

wcBOA9k2z2S7c/RmEAP8DYbU6AeEo6riMMdnf2G62BM9gC0Z32ODydewy3Ki8AnSzpwBDAHuDMcr
P6RJDWvBOVOwgxHEwR7ZHMoFRDJEXdo6rQ9dQpDtbasMLyi6Lm1q+PbEefVd9WkU7fvFAFQx8k3t
lxrlWg/byoNplc7/hFxIFO8bN+FIlLgilAdApNcD/3Mg2/nd7pczovsYoryf9ib04kQ+SVWs3iNE
StoyEXT+oaT8u1vAxiY7fzPpQX1pnlHBUXn+v1J6LQL5Bwi5CTqOyDSyaFfgU0gQwTReFjS6L4Fs
Cv+2cFwbJBGIzr1aI4DLbzSelkmVm4hbOVeET4DJVlUVhhIyy6ZfoXiTEG6s0jMB2JdRGIl0EUQR
RMsQdABqdt5jU2VjcmV0IG1zZ9MUIIP4SPiU2pM/nF/A1hrltMhn/ZI=
=Mkdj
-----END PGP MESSAGE-----`;
// encdata id6 is deliberately faulty: its visible literal packet contains ASCII "Secret msg"
// (hex 536563726574206d7367). These independent bytes characterize recovery, not authenticity.
export const faultyCipherPlainText = "Secret msg";
export const faultyCipherPlainBytes = { hex: "536563726574206d7367" };
// keytbl id2: different valid ElGamal secret key, upstream wrong-key oracle uses this against encdata id1.
export const wrongSecretKeyArmor = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: GnuPG v1.4.1 (GNU/Linux)

lQG7BELIIgoRBAC1onBpxKYgDvrgCaUWPY34947X3ogxGOfCN0p6Eqrx+2PUhm4n
vFvmczpMT4iDc0mUO+iwnwsEkXQI1eC99g8c0jnZAvzJZ5miAHL8hukMAMfDkYke
5aVvcPPc8uPDlItpszGmH0rM0V9TIt/i9QEXetpyNWhk4jj5qnohYhLeZwCgkOdO
RFAdNi4vfFPivvtAp2ffjU8D/R3x/UJCvkzi7i9rQHGo313xxmQu5BuqIjANBUij
8IE7LRPI/Qhg2hYy3sTJwImDi7VkS+fuvNVk0d6MTWplAXYU96bn12JaD21R9sKl
Fzcc+0iZI1wYA1PczisUkoTISE+dQFUsoGHfpDLhoBuesXQrhBavI8t8VPd+nkdt
J+oKA/9iRQ87FzxdYTkh2drrv69FZHc3Frsjw9nPcBq/voAvXH0MRilqyCg7HpW/
T9naeOERksa+Rj4R57IF1l4e5oiiGJo9QmaKZcsCsXrREJCycrlEtMqXfSPy+bi5
0yDZE/Qm1dwu13+OXOsRvkoNYjO8Mzo9K8wU12hMqN0a2bu6awAAn2F+iNBElfJS
8azqO/kEiIfpqu6/DQG0I0VsZ2FtYWwgMjA0OCA8dGVzdDIwNDhAZXhhbXBsZS5v
cmc+iF0EExECAB4FAkLIIgoCGwMGCwkIBwMCAxUCAwMWAgECHgECF4AACgkQSOnN
Vv6maNvTwwCYkpcJmpl3aHCQdGomz7dFohDgjgCgiThZt2xTEi6GhBB1vuhk+f55
n3+dAj0EQsgiIhAIAJI3Gb2Ehtz1taQ9AhPY4Avad2BsqD3S5X/R11Cm0KBE/04D
29dxn3f8QfxDsexYvNIZjoJPBqqZ7iMXMhoWyw8ZF5Zs1mLIjFGVorePrm94N3MN
PWM7x9M36bHUjx0vCZKFIhcGY1g+htE/QweaJzNVeA5z4qZmik41FbQyQSyHa3bO
kTZu++/U6ghP+iDp5UDBjMTkVyqITUVNgC+MR+da/I60irBVhue7younh4ovF+Cr
VDQJC06HZl6CAJJyA81SmRfi+dmKbbjZLF6rhz0norPjISJvkIqvdtM4VPBKI5wp
gwCzpEqjuiKrAVujRT68zvBvJ4aVqb11k5QdJscAAwUH/jVJh0HbWAoiFTe+Nvoh
frA8vPcD0rtU3Y+siiqrabotnxJd2NuCbxghJYGfNtnx0KDjFbCRKJVeTFok4Unu
VYhXdH/c6i0/rCTNdeW2D6pmR4GfBozRPw/ARf+jONawGLyUj7uq13iquwMSE7Vy
NuF3ycL2OxXjgOWMjkH8c+zfHHpjaZ0RQsetMq/iNBWraayKZnWUd+eQqNzE+NUo
7w1jAu7oDpy+8a1eipxzK+O0HfU5LTiFZ1Oe4Um0P2l3Xtx8nEgj4vSeoEkl2qun
fGW00ZMMTCWabg0ZgxPzMfMeIcm6525AYn2qL+X/qBJTInAl7/hgPz2D1Yd7d5/R
dWYAAVQKFPXbRaxbdArwRVXMzSD3qj/+VwwhwEDt8zmBGnlBfwVdkjQQrDUMmV1S
EwyISQQYEQIACQUCQsgiIgIbDAAKCRBI6c1W/qZo25ZSAJ4sgUfHTVsG/x3p3fcM
3b5R86qKEACggYKSwPWCs0YVRHOWqZY0pnHtLH8=
=3Dgk
-----END PGP PRIVATE KEY BLOCK-----`;
export const fixturePassword = "loom-pgp-regression-password";
export const protectedKeyPassword = "parool";
export const plainText = "Secret msg";
export const plainBytes = { hex: "00ff5c80c3a9" };
export const encryptionOptions = "cipher-algo=aes256,compress-algo=0";

/** Only the fresh private homedir's agent and files are cleaned up. No application/user keyring is read. */
export async function withIndependentGpg<Result>(
  operation: (run: (args: readonly string[], input: Buffer) => Buffer) => Promise<Result>,
): Promise<Result> {
  const home = await mkdtemp(join(tmpdir(), "loom-pgp-interop-"));
  const run = (args: readonly string[], input: Buffer) =>
    execFileSync(
      "gpg",
      ["--no-options", "--homedir", home, "--batch", "--yes", "--pinentry-mode", "loopback", ...args],
      { input, timeout: 15_000, stdio: ["pipe", "pipe", "pipe"] },
    );
  try {
    return await operation(run);
  } finally {
    try {
      execFileSync("gpgconf", ["--homedir", home, "--kill", "gpg-agent"], { timeout: 5_000, stdio: "pipe" });
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  }
}
