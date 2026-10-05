"use client";
import { createKelloNeonReact } from "kello/react/neon";
import { createClient } from "../../kello/_generated/api";
export const serviceUrl = import.meta.env.VITE_LOOM_SERVICE_URL!;
export const { KelloProvider, useKello, auth } = createKelloNeonReact(createClient, { serviceUrl });
export type Notes = Awaited<ReturnType<ReturnType<typeof createClient>["client"]["examples"]["notes"]>>;
