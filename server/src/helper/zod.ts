import { z } from "zod";

// cf: https://github.com/colinhacks/zod/issues/372
export const schemaForType =
  <T>() =>
  <S extends z.ZodType<T>>(arg: S) => {
    return arg;
  };
