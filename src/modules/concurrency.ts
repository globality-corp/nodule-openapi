import { getConfig } from "@globality/nodule-config";
import { isNil } from "lodash";
import throat from "throat";

import { Config } from "../types/config";

const DEFAULT_CONCURRENCY = 1;

/* Set concurrency limit from either user input, configuration, or default.
 */
function getConcurrency(concurrencyLimit: number | null) {
  if (!isNil(concurrencyLimit)) {
    return concurrencyLimit;
  }
  return parseInt(
    (
      getConfig<Config, "concurrency.limit">("concurrency.limit") ??
      DEFAULT_CONCURRENCY
    ).toString(),
    10
  );
}

export default function concurrentPaginate<PromiseResult>(
  promises: Promise<PromiseResult>[],
  concurrencyLimit: number | null = null
): Promise<PromiseResult[]> {
  // @ts-expect-error throat types do not support this call
  const throatWithPromise = throat(Promise);

  const concurrency = getConcurrency(concurrencyLimit);
  const funneledThroat = throatWithPromise(concurrency);
  return Promise.all(
    // @ts-expect-error throat types do not support this call
    promises.map((promise) =>
      funneledThroat(() => promise)
    ) as unknown as Promise<PromiseResult>[]
  );
}
