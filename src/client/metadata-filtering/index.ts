import DOMPurify from 'isomorphic-dompurify';
import he from 'he'; /** html entities @see https://github.com/mathiasbynens/he */

/**
 * @see https://github.com/cure53/DOMPurify/blob/main/README.md#can-i-configure-dompurify
 */
const SANITIZE_OPTIONS_NO_HTML = {
  USE_PROFILES: { html: false },
};
const SANITIZE_OPTIONS_ALLOWED_HTML = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
};

/**
 * TODO: expand string sanitization; revise default options above.
 * @param str
 * @param allowHtml
 * @param {Object} sanitizeOptions @see SANITIZE_OPTIONS_NO_HTML
 * @returns {string} The sanitized string if not falsy, else: an empty string
 */
export function sanitizeString(str : string, allowHtml = false, sanitizeOptions = {}) : string {
  if (!str || typeof str !== 'string') return '';
  if (str.match(/^\w+$/)) return str;

  const defaultOptions = allowHtml ? SANITIZE_OPTIONS_ALLOWED_HTML : SANITIZE_OPTIONS_NO_HTML;
  const sanitized = DOMPurify.sanitize(str, { ...defaultOptions, ...sanitizeOptions }).trim();
  return allowHtml ? sanitized : he.decode(sanitized);
}

/**
 * TODO: employ proper URI sanitization
 *       do: allow any future TLD's, like '.crypto'
 *       don't: allow any protocols unknown to HTTP GET, like 'rss3://';
 *              these can be handled in f.i. sanitizeWeb3Uri()
 * @param uri
 * @param throwOnError
 * @returns {string} The sanitized `uri` if valid, else if `!throwOnError`: an empty string
 * @throws {Error} If `throwOnError` and `uri` is an invalid URI
 */
export function sanitizeUri(uri : string, throwOnError = false) : string {
  let sanitizedUri = sanitizeString(uri, false);

  if (throwOnError && !sanitizedUri) {
    throw new Error(`${uri} is not a valid link.`);
  }
  return sanitizedUri;
}

/**
 * @param arr1
 * @param arr2
 * @returns {Array.<string>} The given arrays, concatenated, mapped to lower case & sanitized,
 *   omitting any duplicate/empty strings and non-string elements
 */
export function mergeArraysToLowerCase(arr1 : any[] = [], arr2 : any[] = []) : string[] {
  const filterArray = (arr : any[]) => (arr || [])
    .map(x => typeof x === 'string' ? sanitizeString(x.toLowerCase()) : '')
    .filter(x => x);

  return [...new Set(filterArray(arr1).concat(filterArray(arr2)))];
}
