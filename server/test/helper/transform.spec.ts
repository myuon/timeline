import assert from "assert";
import { transformContent } from "../../src/helper/transform";

describe("transformContent", () => {
  it("should parse a URL", () => {
    const actual = transformContent(`See: https://example.com`);
    assert.equal(
      `<p>See: <a href="https://example.com" rel="noopener noreferer" target="_blank">example.com</a></p>`,
      actual
    );
  });

  it("should parse query string", () => {
    const actual = transformContent(`See: https://example.com?foo=bar&baz=10`);
    assert.equal(
      `<p>See: <a href="https://example.com?foo=bar&baz=10" rel="noopener noreferer" target="_blank">example.com?foo=bar&amp;baz=10</a></p>`,
      actual
    );
  });

  it("should parse a URL enclosed by quote", () => {
    const actual = transformContent(`See: "https://example.com"`);
    assert.equal(
      `<p>See: &quot;<a href="https://example.com" rel="noopener noreferer" target="_blank">example.com</a>&quot;</p>`,
      actual
    );
  });

  it("should parse a HTTP URL", () => {
    const actual = transformContent(`See: "http://example.com"`);
    assert.equal(
      `<p>See: &quot;<a href="http://example.com" rel="noopener noreferer" target="_blank">example.com</a>&quot;</p>`,
      actual
    );
  });
});
