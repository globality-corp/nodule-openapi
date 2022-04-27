import { TooManyResults } from "../../error";

export default async function none<
  RequestFunc extends (...args: any) => Promise<{ items: unknown[] }>
>(
  req: Parameters<RequestFunc>[0],
  {
    searchRequest,
    args = {},
  }: {
    searchRequest: RequestFunc;
    args: Parameters<RequestFunc>[1];
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
