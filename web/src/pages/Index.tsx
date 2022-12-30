import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import useSWRMutation from "swr/mutation";
import { useAuthToken } from "../api/auth";
import { CreateNoteRequest } from "@/shared/request/note";

const searchUser = async (url: string, { arg: userName }: { arg: string }) => {
  const resp = await fetch(`${url}/${userName}`);
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
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          await fetch("/api/note", {
            method: "POST",
            body: JSON.stringify({
              content: formData.get("content"),
            } as CreateNoteRequest),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        }}
        css={css`
          display: grid;
          gap: 16px;
        `}
      >
        <label>
          <textarea name="content" />
        </label>

        <button type="submit">投稿する</button>
      </form>
    </>
  );
};
