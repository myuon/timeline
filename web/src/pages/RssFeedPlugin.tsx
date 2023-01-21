import { css } from "@emotion/react";
import useSWR from "swr";
import { useAuthGuard, useAuthToken } from "../api/auth";
import { Button } from "../components/button";
import { TextField } from "../components/input";

export const RssFeedPlugin = () => {
  useAuthGuard();

  const { data: token } = useAuthToken();
  const { data: configs, mutate: refetch } = useSWR(
    token ? [token, "/api/plugin/rssfeed/config"] : null,
    async () => {
      const resp = await fetch(`/api/plugin/rssfeed/config`, {
        headers: {
          "Content-Type": "application/activity+json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (resp.ok) {
        return await resp.json();
      }
    }
  );

  return (
    <div
      css={css`
        display: grid;
        gap: 16px;
      `}
    >
      <h2>RssFeed Plugin</h2>

      <ul>
        {configs.map((config: any) => (
          <li
            key={config.url}
            css={css`
              display: flex;
              gap: 8px;
            `}
          >
            {config.title} <a href={config.url}>{config.url}</a>
          </li>
        ))}
      </ul>

      <form
        css={css`
          display: grid;
          gap: 16px;
        `}
        onSubmit={async (event) => {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);

          await fetch("/api/plugin/rssfeed/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: formData.get("title"),
              url: formData.get("url"),
            }),
          });

          await refetch();
        }}
      >
        <TextField label="Title" name="title" />
        <TextField label="URL" name="url" />

        <div>
          <Button type="submit">SUBMIT</Button>
        </div>
      </form>
    </div>
  );
};
