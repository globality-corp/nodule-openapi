/* Request building.
 */
import {
    capitalize,
    get,
    includes,
    lowerCase,
    mapKeys,
    mapValues,
} from 'lodash';

import nameFor from './naming';


/* Build request JSON data.
 */
export function buildData(context, req, args) {
    if (lowerCase(context.method) === 'get') {
        return null;
    }
    return get(args, 'body');
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
    if (!includes(['get', 'delete'], lowerCase(context.method))) {
        return null;
    }

    const options = get(context, 'options', {});
    return mapValues(
        mapKeys(args || {}, (value, key) => nameFor(key, 'query', true, options)),
        // NB: join arrays into comma-separated lists
        value => (Array.isArray(value) ? value.join(',') : value),
    );
}


/* Expand path with a specific key/value.
 */
export function expandPathWithKeyValue(path, key, value, options) {
    const name = nameFor(key, 'path', true, options);
    return path.replace(`{${name}}`, value);
}


/* Expand paths with variable substitutions.
   Remove used vairable from args
 */
export function expandPath(context, path, args) {
    const options = get(context, 'options', {});
    let expandedPath = path;
    const keys = Object.keys(args || {});
    keys.forEach((key) => {
        const value = args[key];
        if (typeof (value) === 'string') {
            // URI encode the value; handling embedded `/`
            const expandedValue = value.split('/').map(
                part => encodeURIComponent(part),
            ).join('/');
            const newPath = expandPathWithKeyValue(expandedPath, key, expandedValue, options);
            if (expandedPath !== newPath) {
                expandedPath = newPath;
                // eslint-disable-next-line no-param-reassign
                delete args[key];
            }
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

export function buildTimeout(context) {
    return parseInt(get(context, 'options.timeout', 5000), 10);
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

/*  Transform open-api to request using the following methods
    Order matters! We want to build the url before assigning args
*/
const DEFAULT_BUILDERS = {
    adapter: buildAdapter,
    headers: buildHeaders,
    method: buildMethod,
    url: buildUrl,
    data: buildData,
    params: buildParams,
    timeout: buildTimeout,
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

    // Shallow copy args. Some builder functions might affect args.
    const builderArgs = Object.assign({}, args);
    return Object.keys(builders).reduce(
        (obj, key) => Object.assign(obj, {
            [key]: builders[key](context, req, builderArgs, options),
        }),
        baseRequest,
    );
};
