/* Request building.
 */
import {
    capitalize,
    get,
    lowerCase,
    mapValues,
} from 'lodash';

import nameFor from './naming';


/* Build request JSON data.
 */
export function buildData(context, req, args) {
    if (lowerCase(context.method) === 'get') {
        return null;
    }
    // NB: we ought to require a `body` argument here (within `args`) instead of sending
    // args verbatim; however too many of our mocks break at the moment if we do so
    // (because the mocks are too naive)
    return args;
}


/* Build request headers.
 */
export function buildHeaders() {
    return {
        'Content-Type': 'application/json; charset=utf-8',
    };
}


/* Build request method.
 */
export function buildMethod(context) {
    return context.method;
}


/* Build request params.
 */
export function buildParams(context, req, args) {
    if (lowerCase(context.method) !== 'get') {
        return null;
    }
    // NB we should use our naming support here; breaks too many mocks to do so yet
    return args;
}


/* Expand path with a specific key/value.
 */
export function expandPathWithKeyValue(path, key, value, options) {
    const name = nameFor(key, 'path', true, options);
    return path.replace(`{${name}}`, value);
}


/* Expand paths with variable substitutions.
 */
export function expandPath(context, path, args) {
    const options = get(context, 'options', {});
    let expandedPath = path;
    Object.keys(args || {}).forEach((key) => {
        const value = args[key];
        if (typeof (value) === 'string') {
            // URI encode the value; handling embedded `/`
            const expandedValue = value.split('/').map(
                part => encodeURIComponent(part),
            ).join('/');
            expandedPath = expandPathWithKeyValue(expandedPath, key, expandedValue, options);
        }
    });
    return expandedPath;
}


/* Build request url, expanding path variables.
 */
export function buildUrl(context, req, args) {
    const { spec, options, path } = context;
    const expand = get(options, 'expandPath', expandPath);

    let defaultBaseUrl;
    if (spec.host) {
        const scheme = spec.schemes ? spec.schemes[0] : 'http';
        defaultBaseUrl = `${scheme}://${spec.host}`;
    } else {
        defaultBaseUrl = 'http://localhost';
    }
    const baseUrl = options ? options.baseUrl || defaultBaseUrl : defaultBaseUrl;
    const expandedPath = expand(context, path, args);
    return `${baseUrl}${spec.basePath}${expandedPath}`;
}


/* Build base request (to be overridden by other builders).
 */
export function buildBaseRequest() {
    return {
        maxContentLength: -1,
    };
}


/* Build request adapter (useful for mocks).
 */
export function buildAdapter(context) {
    return get(context, 'options.adapter', null);
}


const DEFAULT_BUILDERS = {
    adapter: buildAdapter,
    data: buildData,
    headers: buildHeaders,
    method: buildMethod,
    params: buildParams,
    url: buildUrl,
};


/* Build a request.
 */
export default (context, req, args, options) => {
    const builders = mapValues(
        DEFAULT_BUILDERS,
        (value, key) => get(context, `options.build${capitalize(key)}`, value),
    );

    const baseRequest = get(context, 'options.buildBaseRequest', buildBaseRequest)(
        context,
        req,
        args,
        options,
    );

    return Object.keys(builders).reduce(
        (obj, key) => Object.assign(obj, {
            [key]: builders[key](context, req, args, options),
        }),
        baseRequest,
    );
};
