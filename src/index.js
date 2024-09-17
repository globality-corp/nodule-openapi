import Client from './client.js';

export {
    OpenAPIError,
    MaxLimitReached,
    TooManyResults,
    NoResults,
} from './error.js';
export {
    all,
    allForBodySearchRequest,
    any,
    concurrentPaginate,
    first,
    none,
    one,
    oneSafe,
    firstSafe,
} from './modules/index.js';
export {
    mockError,
    mockResponse,
    mockResponseVitest,
    mockErrorVitest,
} from './testing/index.js';
export { createOpenAPIClient } from './clients/index.js';
export { createOpenAPIClientV2 } from './openApiCodeGenClients/index.js';
export default Client;
