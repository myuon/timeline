import { CreateNoteRequest } from "@/shared/request/note";
import { css } from "@emotion/react";
import React from "react";
import { Link, Outlet } from "react-router-dom";

export const IndexLayout = () => {
  return (
    <main
      css={css`
        display: grid;
        grid-template-columns: 1fr 200px;
        gap: 32px;
        align-items: flex-start;
      `}
    >
      <Outlet />

      <nav>
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
          <li>
            <Link to="/login">LOGIN</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
};
