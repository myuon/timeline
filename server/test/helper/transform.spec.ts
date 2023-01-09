import assert from "assert";
import { transformContent } from "../../src/helper/transform";

it("transformContent", () => {
  const actual = transformContent(`See: https://example.com`);
  assert.equal(
    `<p>See: <a href="https://example.com" rel="noopener noreferer" target="_blank">https://example.com</a></p>`,
    actual
  );
});
