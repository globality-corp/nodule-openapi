/* Error handling.
 */
import { get } from 'lodash';


export function OpenAPIError(message = null, code = 500, data = null) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
    this.data = data;
}


/* Extract the most useful fields from an error.
 */
export function normalizeError(error) {
    const data = get(error, 'response.data', null);
    const message = get(data, 'message') || get(error, 'message', null);
    const code = get(data, 'code') || get(error, 'response.status') || get(error, 'code', null);

    return new OpenAPIError(message, code, data);
}


/* Build error from response data.
 */
export default context => get(
    context,
    'options.buildError',
    (error) => {
        throw normalizeError(error);
    },
);
