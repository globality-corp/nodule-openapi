import { TooManyResults, NoResults } from "../../error";

type Result<Item> = {
  items: Item[];
};

export default async function one<
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
    searchRequest: RequestFn;
    args: Args;
    returnNullOnEmpty?: boolean;
  }
) {
  const page = await searchRequest(req, args);
  if (page.items.length === 1) {
    return page.items[0];
  }
  if (page.items.length > 1) {
    throw new TooManyResults(
      `Too many results found for search: ${page.items.length}`
    );
  }
  if (returnNullOnEmpty) {
    return null;
  }
  throw new NoResults("No results found for search");
}
