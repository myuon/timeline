import escape from "escape-html";

export const transformContent = (content: string) => {
  const tree = [];
  const urlMatched = content.matchAll(/(https?:\/\/[^\s"]+)/g);

  let prev = 0;
  for (const match of urlMatched) {
    if (match.index) {
      tree.push({ text: content.slice(prev, match.index) });
      prev = match.index + match[0].length;

      tree.push({
        url: match[0],
      });
    }
  }
  tree.push({
    text: content.slice(prev),
  });

  let escaped = "";
  for (const node of tree) {
    if (node.text) {
      escaped += escape(node.text);
    }
    if (node.url) {
      escaped += `<a href="${
        node.url
      }" rel="noopener noreferer" target="_blank">${escape(
        node.url.split("://")[1]
      )}</a>`;
    }
  }

  return `<p>${escaped.split("\n").reduce((x, y) => x + "<br />" + y)}</p>`;
};
