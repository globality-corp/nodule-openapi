import { NoResults } from "../../error";

export default async function first<
  Item,
  RequestFunc extends (...params: any) => Promise<{ items: Item[] }>
>(
  req: Parameters<RequestFunc>[0],
  {
    searchRequest,
    args = {},
    returnNullOnEmpty = false,
  }: {
    searchRequest: RequestFunc;
    args: Parameters<RequestFunc>[1];
    returnNullOnEmpty?: boolean;
  }
): Promise<Item | null> {
  const page = await searchRequest(req, args);
  if (page.items.length) {
    return page.items[0];
  }
  if (returnNullOnEmpty) {
    return null;
  }
  throw new NoResults("No results found for search");
}
