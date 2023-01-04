export const pemToBuffer = (pem: string) => {
  const lines = pem.split("\n");
  const encoded = lines
    .filter(
      (line) =>
        !line.match(/(-----(BEGIN|END) (PUBLIC|PRIVATE) KEY-----)/) &&
        Boolean(line)
    )
    .join("");
  return Buffer.from(encoded, "base64");
};
