export const tablefuncDigest = "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4";
export const tablefuncDescriptor = {
  name: "tablefunc",
  version: "1.0",
  schema: 'table"func',
  apiSupport: { status: "verified", digest: tablefuncDigest },
} as const;
export const tablefuncInstall = `CREATE SCHEMA "table""func"; CREATE EXTENSION tablefunc WITH SCHEMA "table""func" VERSION '1.0'`;
