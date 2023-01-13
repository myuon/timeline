import { Actor } from "@/shared/model/actor";
import { Note } from "@/shared/model/note";
import { css } from "@emotion/react";
import dayjs from "dayjs";
import { Interweave } from "interweave";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";
dayjs.extend(relativeTime);

export const ANote = ({
  actor,
  note,
  onDelete,
}: {
  actor?: Actor;
  note?: Note;
  onDelete?: () => void;
}) => (
  <div
    css={css`
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;

      p {
        margin: 0;
      }
    `}
  >
    <Link to={`/u/${actor?.federatedId.split("/").pop()}`}>
      <img
        src={actor?.iconUrl}
        alt={actor?.name ?? "-"}
        css={css`
          display: flex;
          width: 48px;
          aspect-ratio: 1;
          border-radius: 4px;
          object-fit: cover;
        `}
      />
    </Link>
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
        <Link
          to={`/u/${actor?.federatedId.split("/").pop()}`}
          css={css`
            font-size: 18px;
            font-weight: 600;
            color: inherit;
            text-decoration: none;
          `}
        >
          {actor?.name}
        </Link>
        <small
          css={css`
            color: #999;
          `}
        >
          {dayjs.unix(note?.createdAt ?? 0).fromNow()}
        </small>
      </div>
      <Interweave content={note?.content} />

      <div
        css={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <button onClick={onDelete}>DELETE</button>
      </div>
    </div>
  </div>
);
