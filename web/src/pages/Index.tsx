import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import { useAuthToken } from "../api/auth";

const searchUser = async (url: string, { arg: userName }: { arg: string }) => {
  const resp = await fetch(`${url}/${userName}`);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }

  return resp.json();
};

const getMe = async ([url, token]: [string, string]) => {
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }

  return resp.json();
};

export const IndexPage = () => {
  const token = useAuthToken();
  const { trigger, data: user } = useSWRMutation(
    `/api/ap/federation`,
    searchUser
  );
  const { data: me } = useSWR(token ? ["/api/me", token] : null, getMe);
  console.log(me);

  return (
    <>
      <Link to="/login">LOGIN</Link>

      <h2>/ Index</h2>

      <form
        css={css`
          display: grid;
          gap: 8px;
        `}
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          await trigger(formData.get("userName") as string);
        }}
      >
        <label>
          Seach for user:
          <input type="text" name="userName" />
        </label>

        <button type="submit">Search</button>
      </form>

      <pre>
        <code>{JSON.stringify(user, null, 2)}</code>
      </pre>

      <form
        onSubmit={() => {
          console.log("submit");
        }}
        css={css`
          display: grid;
          gap: 16px;
        `}
      >
        <label>
          <textarea />
        </label>

        <button type="submit">投稿する</button>
      </form>
    </>
  );
};
