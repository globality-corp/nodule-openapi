import { AxiosResponse } from "axios";

export type MapToCallableOperations<
  T extends Record<string, unknown>,
  Context
> = {
  [key in keyof T]: T[key] extends Record<string, unknown>
    ? MapToCallableOperations<T[key], Context>
    : T[key] extends (...args: infer Args) => Promise<AxiosResponse<infer Resp>>
    ? (
        req: Context,
        args: Args[0],
        options?: Record<string, unknown>
      ) => Promise<Resp>
    : never;
};
