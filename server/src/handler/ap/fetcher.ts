export interface FetcherResult<T> {
  data?: T;
  error?: unknown;
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
      error: {
        status: resp.status,
        statusText: resp.statusText,
        text: await resp.text(),
      },
    };
  }

  return {
    data: await resp.text(),
  };
};
