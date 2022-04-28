import { TooManyResults } from "../../error";

import { BaseRequestFunc } from "./types";

export default async function none<Context, Args, Result>(
  req: Context,
  {
    searchRequest,
    args,
  }: {
    searchRequest: BaseRequestFunc<Context, Args, Result>;
    args: Args;
  }
): Promise<null> {
  const page = await searchRequest(req, args);
  if (page.items.length) {
    throw new TooManyResults(
      `Too many results found for search: ${page.items.length}`
    );
  }
  return null;
}
