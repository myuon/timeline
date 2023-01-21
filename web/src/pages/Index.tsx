import { css } from "@emotion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthGuard, useAuthToken } from "../api/auth";
import { CreateNoteRequest } from "@/shared/request/note";
import useSWR from "swr";
import React from "react";
import { TimelineObject } from "@/shared/model/timeline";
import { Button } from "../components/button";
import {
  styleInputBase,
  styleInputWrapper,
  TextField,
} from "../components/input";
import { AnimatePresence, motion } from "framer-motion";
import { ANote } from "./features/note/Note";
import { useMe } from "../api/api";
import timelineImage from "../../public/timeline.png";

export const IndexPage = () => {
  useAuthGuard();

  const { data: token } = useAuthToken();
  const { data: inbox } = useSWR(
    token ? [token, "/api/timeline/note"] : null,
    async () => {
      const params = new URLSearchParams({
        page: `0`,
        size: `10`,
        type: "Note,Share",
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
    },
    {
      refreshInterval: 30 * 1000,
    }
  );
  const { data: me } = useMe(token);

  const contentFormRef = React.useRef<HTMLTextAreaElement>(null);

  const navigate = useNavigate();

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
          grid-template-columns: 320px 500px 320px;
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
                  {me?.userId}
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

          <form
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);
              const search = formData.get("search");

              if (search) {
                navigate(`/u/${search}`);
              }
            }}
          >
            <TextField
              icon={<i className="bi-search" />}
              placeholder="検索"
              autoComplete="search"
              name="search"
            />
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
            css={css`
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 8px;
            `}
          >
            <TextField name="id" />

            <Button type="submit">Follow</Button>
          </form>

          <div
            css={css`
              display: grid;
              justify-content: center;
            `}
          >
            <img
              src={timelineImage}
              alt=""
              css={css`
                display: flex;
                width: 48px;
                aspect-ratio: 1;
              `}
            />
          </div>
        </div>

        <div
          css={css`
            display: grid;
            gap: 32px;
            max-width: 500px;
            padding: 16px 16px;
            overflow: hidden;
            word-break: break-all;
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
                  gap: 16px;
                `}
              >
                <ANote
                  type={item.type}
                  actor={item.actor}
                  note={item.note}
                  onAnnounce={async () => {
                    await fetch(`/api/note/${item.note?.id}/announce`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    });
                  }}
                  onDelete={async () => {
                    const ok = window.confirm("本当に削除しますか？");
                    console.log(item.note);
                    if (!ok) {
                      return;
                    }

                    await fetch(`/api/note/${item.note?.id}`, {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    });
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div>
          <ul
            css={css`
              display: grid;
              gap: 8px;
              list-style-type: none;
            `}
          >
            <li>
              <Link to="/">INDEX</Link>
            </li>
            <li>
              <Link to="/plugin/rssfeed">PLUGIN: rssfeed</Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
