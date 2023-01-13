import { Actor } from "@/shared/model/actor";
import { Note } from "@/shared/model/note";
import { css } from "@emotion/react";
import dayjs from "dayjs";
import { Interweave } from "interweave";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const ANote = ({ actor, note }: { actor?: Actor; note?: Note }) => (
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
    <div>
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
          {actor?.name}
        </p>
        <small
          css={css`
            color: #999;
          `}
        >
          {dayjs.unix(note?.createdAt ?? 0).fromNow()}
        </small>
      </div>
      <Interweave content={note?.content} />
    </div>
  </div>
);
