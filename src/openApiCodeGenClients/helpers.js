import { buildHeaders } from '../clients/openapi.js';

function createHeaders(req, context, options) {
    /**
     * Header creation function. Uses the build headers func and
     * and then allows for the request specific options to override
     * the initial headers
     */
    const initialHeaders = buildHeaders(
        context,
        req,
    );

    return {
        ...initialHeaders,
        ...(options && options.additionalHeaders ? options.additionalHeaders : {}),
    };
}

function createParamsWrapper(args) {
    let paramsWrapper;
    if (Array.isArray(args)) {
        // Whilst args is an array we need to convert it to an object
        paramsWrapper = {
            params: args.reduce((a, v) => ({ ...a, [v]: v }), {}),
        };
    } else {
        // assuming args is an object (i.e next gen typescript api client generation)
        paramsWrapper = {
            params: args,
        };
    }
    return paramsWrapper;
}

export {
    createHeaders,
    createParamsWrapper,
};
