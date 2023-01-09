import escape from "escape-html";

export const transformContent = (content: string) => {
  return `<p>${escape(content)
    .replace(
      /(https?:\/\/[^\s"]+)/,
      '<a href="$1" rel="noopener noreferer" target="_blank">$1</a>'
    )
    .split("\n")
    .reduce((x, y) => x + "<br />" + y)}</p>`;
};
