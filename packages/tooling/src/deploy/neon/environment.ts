/** Provider defaults must not be replaced by application variables or retained deployment overrides. */
export const neonInjectedVariables = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "NEON_BRANCH",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
] as const;
