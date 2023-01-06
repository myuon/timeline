import fetch, { RequestInfo, RequestInit } from "node-fetch";

export interface FetcherResult<T> {
  data?: T;
  error?: unknown;
  status?: number;
}

export interface FetcherError {
  status: number;
  statusText: string;
  text: string;
}

export const fetcher = async (
  info: RequestInfo,
  init?: RequestInit
): Promise<FetcherResult<string>> => {
  const resp = await fetch(info, init);
  if (!resp.ok) {
    return {
      data: undefined,
      error: {
        statusText: resp.statusText,
        text: await resp.text(),
      },
      status: resp.status,
    };
  }

  return {
    data: await resp.text(),
    error: undefined,
    status: resp.status,
  };
};
