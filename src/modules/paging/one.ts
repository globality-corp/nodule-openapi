import { TooManyResults, NoResults } from "../../error";

type Page<Item> = {
  items: Item[];
  offset?: number;
  limit?: number;
  count: number;
};

type BaseRequestFunc<Context, Args, Result> = (
  context: Context,
  args: Args
) => Promise<Page<Result>>;

export default async function one<Context, Args, Result>(
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
