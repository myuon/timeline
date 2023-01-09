import { css } from "@emotion/react";
import React from "react";

export const styleInputWrapper = css`
  padding: 8px 12px;
  background-color: #303030;
  border: 1px solid transparent;
  border-radius: 4px;

  &:has(input:focus) {
    border: 1px solid #555;
  }
  &:focus {
    border: 1px solid #555;
  }
`;

export const styleInputBase = css`
  width: 100%;
  font-size: 16px;
  color: inherit;
`;

export const TextField = ({
  icon,
  ...props
}: { icon?: React.ReactNode } & React.ComponentPropsWithoutRef<"input">) => {
  return (
    <div
      css={[
        css`
          display: flex;
          gap: 12px;
          align-items: center;
        `,
        styleInputWrapper,
      ]}
    >
      <input type="text" css={styleInputBase} {...props} />
      {icon}
    </div>
  );
};
