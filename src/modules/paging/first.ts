import { NoResults } from "../../error";

type Result<Item> = {
  items: Item[]
}

export default async function first<
  Item,
  Context,
  Args,
  RequestFn extends (context: Context, args: Args) => Promise<Result<Item>>
>(
  req: Context,
  {
    searchRequest,
    args,
    returnNullOnEmpty = false,
  }: {
    searchRequest: RequestFn
    args: Args;
    returnNullOnEmpty?: boolean;
  }
): Promise<Awaited<ReturnType<RequestFn>>["items"][0] | null> {
  const page = await searchRequest(req, args);
  if (page.items.length) {
    return page.items[0];
  }
  if (returnNullOnEmpty) {
    return null;
  }
  throw new NoResults("No results found for search");
}
