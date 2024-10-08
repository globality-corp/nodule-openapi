import Client from './client';

export {
    OpenAPIError,
    MaxLimitReached,
    TooManyResults,
    NoResults,
} from './error';
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
} from './modules';
export {
    mockError,
    mockResponse,
    mockResponseVitest,
    mockErrorVitest,
} from './testing';
export { createOpenAPIClient } from './clients';
export { createOpenAPIClientV2 } from './openApiCodeGenClients';
export default Client;
