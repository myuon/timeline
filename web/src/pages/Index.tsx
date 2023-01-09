import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { useAuthGuard, useAuthToken } from "../api/auth";
import { CreateNoteRequest } from "@/shared/request/note";
import useSWR from "swr";
import React from "react";
import dayjs from "dayjs";
import { TimelineObject } from "@/shared/model/timeline";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const IndexPage = () => {
  useAuthGuard();

  const { data: token } = useAuthToken();
  const { data: notes, mutate: refetch } = useSWR(
    "/u/myuon/outbox?page=true",
    async (url) => {
      const resp = await fetch(url, {
        headers: {
          "Content-Type": "application/activity+json",
        },
      });
      if (resp.ok) {
        return resp.json();
      }
    }
  );
  const { data: inbox } = useSWR(
    token ? [token, "/api/timeline/note"] : null,
    async () => {
      const params = new URLSearchParams({
        page: `0`,
        size: `10`,
        type: "Note",
      });

      const resp = await fetch(`/api/timeline/note?${params}`, {
        headers: {
          "Content-Type": "application/activity+json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (resp.ok) {
        return (await resp.json()) as TimelineObject[];
      }
    }
  );

  const contentFormRef = React.useRef<HTMLTextAreaElement>(null);

  return (
    <section
      css={css`
        display: grid;
        gap: 32px;
      `}
    >
      <Link to="/login">LOGIN</Link>

      <h2>/ Index</h2>

      <div
        css={css`
          display: grid;
          gap: 24px;
          max-width: 500px;
          padding: 8px 16px;
          background-color: #303030;
        `}
      >
        {inbox?.map((item) => (
          <div
            key={item.id}
            css={css`
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 16px;

              p {
                margin: 0;
              }
            `}
          >
            <div>
              <img
                src={item.actor?.iconUrl}
                alt={item.actor?.name ?? "-"}
                css={css`
                  display: flex;
                  width: 48px;
                  aspect-ratio: 1;
                  border-radius: 4px;
                  object-fit: cover;
                `}
              />
            </div>
            <div>
              <div
                css={css`
                  display: flex;
                  gap: 8px;
                  justify-content: space-between;
                `}
              >
                <p
                  css={css`
                    font-size: 18px;
                    font-weight: 600;
                  `}
                >
                  {item.actor?.name}
                </p>
                <small>{dayjs.unix(item.note?.createdAt ?? 0).fromNow()}</small>
              </div>
              <p>{item.note?.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        css={css`
          display: grid;
          gap: 16px;
        `}
      >
        {notes?.orderedItems?.map((note: any) => (
          <div
            key={note.id}
            css={css`
              display: grid;

              p {
                margin: 0;
              }
            `}
          >
            <p>{note.object.content}</p>
            <p>
              {note.published} -{" "}
              <button
                onClick={async () => {
                  const ok = window.confirm("本当に削除しますか？");
                  if (!ok) {
                    return;
                  }

                  const noteId = note.id.split("s/")[1].split("/")[0];

                  await fetch(`/api/note/${noteId}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  });

                  await refetch();
                }}
              >
                DELETE
              </button>
            </p>
          </div>
        ))}
      </div>

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

          if (contentFormRef.current) {
            contentFormRef.current.value = "";
          }

          await refetch();
        }}
        css={css`
          display: grid;
          gap: 16px;
        `}
      >
        <label>
          <textarea name="content" ref={contentFormRef} />
        </label>

        <button type="submit">投稿する</button>
      </form>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);
          const id = formData.get("id");

          await fetch("/api/follow", {
            method: "POST",
            body: JSON.stringify({
              id,
            }),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        }}
      >
        <input type="text" name="id" />

        <button type="submit">Follow</button>
      </form>
    </section>
  );
};
