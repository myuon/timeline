import { css } from "@emotion/react";
import useSWRMutation from "swr/mutation";

const searchUser = async (url: string, { arg: userName }: { arg: string }) => {
  const resp = await fetch(`${url}/${userName}`);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }

  return resp.json();
};

export const IndexPage = () => {
  const { trigger, data: user } = useSWRMutation(`/api/federation`, searchUser);

  return (
    <>
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
