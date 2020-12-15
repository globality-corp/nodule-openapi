/* Error handling.
 */
/* eslint max-classes-per-file: 0 */
import { get } from 'lodash';
import { StatusCodes } from 'http-status-codes';

export class OpenAPIError extends Error {
    constructor(message = null, code = 500, data = null, headers = null) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.data = data;
        this.headers = headers;
    }
}

export class TooManyResults extends OpenAPIError {
    constructor(message = 'Too Many Results') {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

export class NoResults extends OpenAPIError {
    constructor(message = 'No Results') {
        super(message, StatusCodes.NOT_FOUND);
    }
}

export class MaxLimitReached extends OpenAPIError {
    constructor(message = 'Max Limit Reached') {
        super(message, StatusCodes.GATEWAY_TIMEOUT);
    }
}

/* Extract the most useful fields from an error.
 */
export function normalizeError(error) {
    const data = get(error, 'response.data', null);
    const message = get(data, 'message') || get(error, 'message', null);
    const code = get(data, 'code') || get(error, 'response.status') || get(error, 'code', null);
    const req = get(error, 'request', null);
    const headers = req && req.getHeaders ? req.getHeaders() : null;

    return new OpenAPIError(message, code, data, headers);
}

/* Build error from response data.
 */
export default (context) => get(
    context,
    'options.buildError',
    (error) => {
        throw normalizeError(error);
    },
);
