import { BaseRequestFunc } from "./types";

export default async function any<Context, Args, Result>(
  req: Context,
  {
    searchRequest,
    args,
  }: {
    searchRequest: BaseRequestFunc<Context, Args, Result>;
    args: Args;
  }
): Promise<boolean> {
  const page = await searchRequest(req, args);
  return page.items.length > 0;
}
