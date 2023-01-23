import { fetcher } from "../helper/fetcher";

export const newFetchClient = () => {
  return {
    fetcher,
  };
};

export type FetchClient = ReturnType<typeof newFetchClient>;
export type Fetcher = typeof fetcher;
