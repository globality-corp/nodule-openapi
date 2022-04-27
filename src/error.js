/* eslint-disable max-classes-per-file */

/* Error handling.
 */
import {
  GATEWAY_TIMEOUT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "http-status-codes";
import { get, omitBy } from "lodash";

// We are accidentally leaking auth headers to loggly when throwing
// an OpenAPIError. We want to fix this properly in the long term,
// but as a short term solution we are simply going to omit the headers
// from the error here. This operation is case insensitive.
function pruneAuthorizationHeaders(headers) {
  if (!headers) {
    return headers;
  }

  const disallowed = ["authorization"];
  return omitBy(headers, (val, key) =>
    disallowed.includes(key.toLowerCase().trim())
  );
}

export class OpenAPIError extends Error {
  constructor(message = null, code = 500, data = null, headers = null) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.data = data;
    this.headers = pruneAuthorizationHeaders(headers);
  }
}

export class TooManyResults extends OpenAPIError {
  constructor(message = "Too Many Results") {
    super(message, INTERNAL_SERVER_ERROR);
  }
}

export class NoResults extends OpenAPIError {
  constructor(message = "No Results") {
    super(message, NOT_FOUND);
  }
}

export class MaxLimitReached extends OpenAPIError {
  constructor(message = "Max Limit Reached") {
    super(message, GATEWAY_TIMEOUT);
  }
}

/* Extract the most useful fields from an error.
 */
export function normalizeError(error) {
  const data = get(error, "response.data", null);
  const message = get(data, "message") || get(error, "message", null);
  const code =
    get(data, "code") ||
    get(error, "response.status") ||
    get(error, "code", null);
  const req = get(error, "request", null);
  const headers = req && req.getHeaders ? req.getHeaders() : null;

  return new OpenAPIError(message, code, data, headers);
}

/* Build error from response data.
 */
export default (context) =>
  get(context, "options.buildError", (error) => {
    throw normalizeError(error);
  });
