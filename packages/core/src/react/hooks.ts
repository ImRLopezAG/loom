"use client";

import { useLoomContext } from "./provider";
export { useQuery, useMutation, useSuspenseQuery, useQueries, useQueryClient } from "@tanstack/react-query";
export function useLoomClient() {
  return useLoomContext().client;
}
