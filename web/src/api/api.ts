import { Actor } from "@/shared/model/actor";
import useSWR from "swr";

export const useMe = (token: string | undefined) => {
  return useSWR(token ? [token, "/api/me"] : null, async () => {
    const resp = await fetch(`/api/me`, {
      headers: {
        "Content-Type": "application/activity+json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (resp.ok) {
      return (await resp.json()) as Actor;
    }
  });
};
