import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { useAuthGuard, useAuthToken } from "../api/auth";
import { CreateNoteRequest } from "@/shared/request/note";
import useSWR from "swr";
import React from "react";
import dayjs from "dayjs";
import { TimelineObject } from "@/shared/model/timeline";
import relativeTime from "dayjs/plugin/relativeTime";
import { Actor } from "@/shared/model/actor";
import { Button } from "../components/button";
import {
  styleInputBase,
  styleInputWrapper,
  TextField,
} from "../components/input";
import { AnimatePresence, motion } from "framer-motion";
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
  const { data: me } = useSWR(token ? [token, "/api/me"] : null, async () => {
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
          grid-template-columns: 320px 500px;
          gap: 32px;
          align-items: flex-start;
        `}
      >
        <div
          css={css`
            display: grid;
            gap: 32px;
          `}
        >
          <div
            css={css`
              display: grid;
              gap: 16px;
            `}
          >
            <div
              css={css`
                display: flex;
                gap: 16px;
                align-items: flex-start;
              `}
            >
              <img
                src={me?.iconUrl}
                alt={me?.name ?? "-"}
                css={css`
                  display: flex;
                  width: 48px;
                  aspect-ratio: 1;
                  border-radius: 4px;
                  object-fit: cover;
                `}
              />

              <div>
                <p
                  css={css`
                    font-size: 18px;
                    font-weight: 600;
                  `}
                >
                  {me?.name}
                </p>

                <p
                  css={css`
                    color: #999;
                  `}
                >
                  {me?.name}@{me ? new URL(me?.federatedId).host : ""}
                </p>
              </div>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                const content = formData.get("content");
                if (!content) {
                  return;
                }

                await fetch("/api/note", {
                  method: "POST",
                  body: JSON.stringify({
                    content,
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
              <textarea
                name="content"
                placeholder="いまどうしてる？"
                ref={contentFormRef}
                css={[
                  styleInputBase,
                  styleInputWrapper,
                  css`
                    resize: none;
                  `,
                ]}
                rows={5}
              />

              <div
                css={css`
                  display: flex;
                  justify-content: flex-end;
                `}
              >
                <Button type="submit">投稿する</Button>
              </div>
            </form>
          </div>

          <div>
            <TextField icon={<i className="bi-search" />} placeholder="検索" />
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
            css={css`
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 16px;
            `}
          >
            <TextField name="id" />

            <Button type="submit">Follow</Button>
          </form>
        </div>

        <div
          css={css`
            display: grid;
            gap: 32px;
            max-width: 500px;
            padding: 16px 16px;
            overflow: hidden;
            background-color: #303030;
            border-radius: 4px;
          `}
        >
          <AnimatePresence initial={false}>
            {inbox?.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ y: -100 }}
                animate={{ y: 0 }}
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
                <div
                  css={css`
                    display: grid;
                    gap: 4px;
                  `}
                >
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
                    <small>
                      {dayjs.unix(item.note?.createdAt ?? 0).fromNow()}
                    </small>
                  </div>
                  {item.note?.content.split("\n").map((t, index) => (
                    <p key={index}>{t}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
