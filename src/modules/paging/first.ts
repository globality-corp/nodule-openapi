import { NoResults } from "../../error";

import { BaseRequestFunc } from "./types";

export default async function first<Context, Args, Result>(
  req: Context,
  {
    searchRequest,
    args,
    returnNullOnEmpty = false,
  }: {
    searchRequest: BaseRequestFunc<Context, Args, Result>;
    args: Args;
    returnNullOnEmpty?: boolean;
  }
) {
  const page = await searchRequest(req, args);
  if (page.items.length) {
    return page.items[0];
  }
  if (returnNullOnEmpty) {
    return null;
  }
  throw new NoResults("No results found for search");
}
