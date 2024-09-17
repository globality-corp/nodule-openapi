import { isNil } from 'lodash-es';
import throat from 'throat';
import { getConfig } from '@globality/nodule-config';

const DEFAULT_CONCURRENCY = 1;

/* Set concurrency limit from either user input, configuration, or default.
 */
function getConcurrency(concurrencyLimit) {
    if (!isNil(concurrencyLimit)) {
        return concurrencyLimit;
    }
    // @ts-ignore
    return parseInt(getConfig('concurrency.limit') || DEFAULT_CONCURRENCY, 10);
}

export default function concurrentPaginate(promises, concurrencyLimit = null) {
    // @ts-ignore
    const throatWithPromise = throat(Promise);

    const concurrency = getConcurrency(concurrencyLimit);
    const funneledThroat = throatWithPromise(concurrency);
    return Promise.all(
        // @ts-ignore
        promises.map((promise) => funneledThroat(() => promise)),
    );
}
