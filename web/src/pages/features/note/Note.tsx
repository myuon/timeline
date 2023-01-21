import { Actor } from "@/shared/model/actor";
import { Note } from "@/shared/model/note";
import { css } from "@emotion/react";
import dayjs from "dayjs";
import { Interweave } from "interweave";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";
dayjs.extend(relativeTime);

export const ANote = ({
  type,
  actor,
  note,
  onAnnounce,
  onDelete,
}: {
  type?: string;
  actor?: Actor;
  note?: Note;
  onAnnounce?: () => void;
  onDelete?: () => void;
}) => {
  const isPlugin = note?.userId.startsWith("plugin:");
  const pluginName = isPlugin ? note?.userId.split("plugin:")[1] : undefined;

  return (
    <div
      css={css`
        display: grid;
        gap: 8px;
      `}
    >
      {type === "Share" && (
        <p
          css={css`
            display: flex;
            gap: 8px;
          `}
        >
          <i className="bi-megaphone" />
          Announceされました
        </p>
      )}

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
        <Link
          to={
            isPlugin
              ? `/plugin/${pluginName}`
              : `/u/${actor?.name || actor?.userId}`
          }
          css={css`
            text-decoration: none;
          `}
        >
          {actor && (
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
          )}
          {isPlugin && (
            <i
              className="bi-gear"
              css={css`
                display: grid;
                place-items: center;
                width: 48px;
                aspect-ratio: 1;
                font-size: 36px;
                background-color: #eee;
                border-radius: 4px;
              `}
            />
          )}
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
              to={
                isPlugin
                  ? `/plugin/${pluginName}`
                  : `/u/${actor?.name || actor?.userId}`
              }
              css={css`
                font-size: 18px;
                font-weight: 600;
                color: inherit;
                text-decoration: none;
              `}
            >
              {actor?.name || actor?.userId || pluginName}
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
            <div
              css={css`
                display: flex;
                gap: 16px;
              `}
            >
              <button onClick={onAnnounce}>
                <i className="bi-megaphone" />
              </button>
              <button onClick={onDelete}>
                <i className="bi-trash" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
