import { booleanCodec, compositeCodec, nullableCodec, textCodec } from "../codecs";
import { int4Codec } from "../native-codecs";

/** OUT columns of postgres_fdw_get_connections, in captured catalogue order. */
export const postgresFdwConnectionFields = {
  server_name: textCodec,
  user_name: nullableCodec(textCodec),
  valid: booleanCodec,
  used_in_xact: booleanCodec,
  closed: nullableCodec(booleanCodec),
  remote_backend_pid: int4Codec,
} as const;

export const postgresFdwConnectionCodec = compositeCodec(
  "postgres_fdw_get_connections",
  postgresFdwConnectionFields,
);

export type PostgresFdwConnection = {
  readonly server_name: string;
  readonly user_name: string | null;
  readonly valid: boolean;
  readonly used_in_xact: boolean;
  readonly closed: boolean | null;
  readonly remote_backend_pid: number;
};
