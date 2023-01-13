export function assertIsDefined<T>(
  value: T | undefined | null
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error("Value is not defined");
  }
}
