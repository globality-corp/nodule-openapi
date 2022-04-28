export type Page<Item> = {
  items: Item[];
  offset?: number;
  limit?: number;
  count: number;
};

export type BaseRequestFunc<Context, Args, Result> = (
  context: Context,
  args: Args
) => Promise<Page<Result>>;
