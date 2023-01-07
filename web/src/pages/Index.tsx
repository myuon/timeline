import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { useAuthGuard, useAuthToken } from "../api/auth";
import { CreateNoteRequest } from "@/shared/request/note";
import useSWR from "swr";
import React from "react";

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

  const contentFormRef = React.useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <Link to="/login">LOGIN</Link>

      <h2>/ Index</h2>

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
              {note.published} - {note.actor}
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
    </>
  );
};
