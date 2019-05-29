/* Callable operations.
 */
import { assign, get } from 'lodash';
import axios from 'axios';

import buildError from './error';
import buildRequest from './request';
import buildResponse from './response';
import Validator from './validation';


/* Create a new callable operation that return a Promise.
 */
export default (context, name, operationName) => async (req, args, options) => {
    // validate inputs
    Validator(context)(req, operationName, args);

    // allow overriding the http implementation
    const http = get(context, 'options.http', () => axios)(req, name, operationName);

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        name,
        operationName,
    });

    return http(
        buildRequest(
            requestContext,
            req,
            args,
            options,
        ),
    ).then(
        response => buildResponse(requestContext)(
            response,
            requestContext,
            req,
            options,
        ),
    ).catch(
        error => buildError(requestContext)(
            error,
            requestContext,
            req,
            options,
        ),
    );
};
