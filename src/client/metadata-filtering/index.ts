import { sanitizeString } from '../../utils';

/**
 * TODO: employ proper URI sanitization
 *       do: allow any future TLD's, like '.crypto'
 *       don't: allow any protocols unknown to HTTP GET, like 'rss3://';
 *              these can be handled in f.i. sanitizeWeb3Uri()
 * @param uri
 * @param throwOnError
 * @returns The sanitized `uri` if valid, else if `!throwOnError`: an empty string
 * @throws {Error} If `throwOnError = true` and `uri` is an invalid URI
 */
export function sanitizeUri(uri : string, throwOnError = false) : string {
  const sanitizedUri = sanitizeString(uri, false);

  if (throwOnError && !sanitizedUri) {
    throw new Error(`${uri} is not a valid link.`);
  }
  return sanitizedUri;
}
