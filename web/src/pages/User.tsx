import { Link, useParams } from "react-router-dom";
import { assertIsDefined } from "../helper/assert";
import useSWR from "swr";
import { css } from "@emotion/react";
import { ActorPresented } from "@/shared/model/actor";
import { Note } from "@/shared/model/note";
import { ANote } from "./features/note/Note";
import { Button } from "../components/button";
import { useMe } from "../api/api";
import { useAuthToken } from "../api/auth";

export const UserPage = () => {
  const { username } = useParams<{ username: string }>();
  assertIsDefined(username);

  const { data: actor } = useSWR(`/api/user/${username}`, async (url) => {
    const resp = await fetch(url, {
      headers: {
        "Content-Type": "application/activity+json",
      },
    });
    if (resp.ok) {
      return (await resp.json()) as ActorPresented;
    }
  });
  const { data: notes } = useSWR(
    `/api/user/${username}/notes?page=0&size=10`,
    async (url) => {
      const resp = await fetch(url, {
        headers: {
          "Content-Type": "application/activity+json",
        },
      });
      if (resp.ok) {
        return (await resp.json()) as Note[];
      }
    }
  );
  const { data: token } = useAuthToken();
  const { data: me } = useMe(token);

  return (
    <div
      css={css`
        display: grid;
        gap: 16px;
        max-width: 550px;
      `}
    >
      <Link to="/">INDEX</Link>

      <h2>/u/{username}</h2>

      <div
        css={css`
          display: grid;
        `}
      >
        <img
          alt=""
          css={css`
            width: 100%;
            aspect-ratio: 4/1;
            background-color: grey;
          `}
        />

        <div
          css={css`
            margin: 0 16px;
          `}
        >
          <div
            css={css`
              display: grid;
              gap: 16px;
            `}
          >
            <img
              src={actor?.iconUrl}
              alt=""
              css={css`
                width: 88px;
                aspect-ratio: 1;
                margin-top: calc(-88px / 2);
                border: 4px solid #fff;
                border-radius: 4px;
              `}
            />

            <div
              css={css`
                display: grid;
                grid-template-columns: 1fr auto;
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
                    display: grid;
                    gap: 4px;
                  `}
                >
                  <h3
                    css={css`
                      font-size: 24px;
                      font-weight: 700;
                      line-height: 24px;
                    `}
                  >
                    {actor?.name}
                  </h3>

                  <p>{actor?.url}</p>
                </div>

                <p>{actor?.summary}</p>
              </div>

              <div>{me?.name !== username && <Button>フォロー</Button>}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        css={css`
          display: grid;
          gap: 16px;
          margin-top: 32px;
        `}
      >
        {notes?.map((note) => (
          <ANote key={note.id} actor={actor} note={note} />
        ))}
      </div>
    </div>
  );
};
