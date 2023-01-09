import assert from "assert";
import { transformContent } from "../../src/helper/transform";

describe("transformContent", () => {
  it("should parse URL", () => {
    const actual = transformContent(`See: https://example.com`);
    assert.equal(
      `<p>See: <a href="https://example.com" rel="noopener noreferer" target="_blank">https://example.com</a></p>`,
      actual
    );
  });

  it("should parse query string", () => {
    const actual = transformContent(`See: https://example.com?foo=bar&baz=10`);
    assert.equal(
      `<p>See: <a href="https://example.com?foo=bar&baz=10" rel="noopener noreferer" target="_blank">https://example.com?foo=bar&baz=10</a></p>`,
      actual
    );
  });
});
