import { getConfig, getContainer, getMetadata } from '@globality/nodule-config';
import axios from 'axios';
import { get } from 'lodash';
import OpenAPI from '../client.js';
import { NAMING_OPTION } from '../naming.js';
import { OpenAPIError } from '../error.js';


/* Inject mock and testing adapters.
 */
export function buildAdapter(context) {
    const { name, operationName } = context;
    const metadata = getMetadata();

    if (!metadata.testing) {
        return null;
    }

    const key = `clients.mock.${name}.${operationName}`;
    const mock = getConfig(key);

    if (mock) {
        return mock;
    }

    return () => {
        throw new Error(`OpenAPI operation ${name}.${operationName} is not mocked`);
    };
}

function defaultExtendHeaders(req, headers) {
    const extendHeaders = {};

    // pass the current service's name
    const metadata = getMetadata();
    extendHeaders['X-Request-Service'] = metadata.name;

    // pass a unique identifier from the requestId middleware
    const requestId = get(req, 'id');
    if (requestId) {
        extendHeaders['X-Request-Id'] = requestId;
    }

    // pass the request start time (usually injected by the morgan library)
    const startTime = get(req, '_startTime', new Date());
    extendHeaders['X-Request-Started-At'] = startTime.toISOString();

    // pass the current user (if any)
    const userId = get(req, 'locals.user.id');
    if (userId) {
        extendHeaders['X-Request-User'] = userId;
    }

    // pass the client id from the user (if any)
    // this is so we can identify which client is making the request
    // prefer value from `locals.client`
    const clientId = get(req, 'locals.client.id') || get(req, 'locals.user.clientId');
    if (clientId) {
        extendHeaders['X-Request-Client'] = clientId;
    }

    // pass the jwt
    const jwt = get(req, 'cookies.idToken');
    if (jwt) {
        extendHeaders.Authorization = `Bearer ${jwt}`;
    }

    return Object.assign(headers, extendHeaders);
}

/* Inject standard headers.
 */
export function buildHeaders(context, req) {
    let headers = {
        'Content-Type': 'application/json; charset=utf-8',
    };

    const extendHeaders = getContainer('extendHeaders') || defaultExtendHeaders;
    if (extendHeaders) {
        headers = extendHeaders(req, headers);
    }

    return headers;
}

export function validateResponse(response) {
    const contentType = get(response, 'headers["content-type"]');
    if (contentType !== 'application/json') {
        const message = `${contentType} is not a valid response content-type`;
        return [false, message];
    }
    return [true, null];
}

export function http() {
    return request => axios(
        request,
    ).then((response) => {
        const [validResponse, message] = validateResponse(response);
        if (!validResponse) {
            throw new OpenAPIError(message, 'invalid_response');
        }
        return response;
    });
}

/* Create a new OpenAPI client using standard conventions:
 *
 *  - Expects `clients.${name}.baseUrl` to be defined
 *  - Automatically mocks requests
 *  - Injects useful headers
 */
export function createOpenAPIClient(name, spec) {
    const metadata = getMetadata();
    const config = getConfig(`clients.${name}`) || {};
    const { baseUrl, timeout, retries, namingOverride, namingPath, namingQuery } = config;

    if (!baseUrl && !metadata.testing && !metadata.debug) {
        throw new Error(`OpenAPI client ${name} does not have a configured baseUrl`);
    }

    const naming = namingOverride ? {
        path: get(NAMING_OPTION, namingPath),
        query: get(NAMING_OPTION, namingQuery),
    } : {};

    const options = {
        baseUrl,
        buildAdapter,
        buildHeaders,
        http,
        timeout,
        retries,
        naming,
    };
    return OpenAPI(spec, name, options);
}
