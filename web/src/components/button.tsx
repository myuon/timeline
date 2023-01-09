import { css } from "@emotion/react";
import React from "react";

export const Button = ({
  ...props
}: React.ComponentPropsWithoutRef<"button">) => {
  return (
    <button
      {...props}
      css={css`
        padding: 8px 16px;
        font-weight: 500;
        color: inherit;
        background-color: #9f1239;
        border-radius: 4px;

        &:hover {
          background-color: #be123c;
        }
        &:active {
          background-color: #be123c;
        }
      `}
    />
  );
};
