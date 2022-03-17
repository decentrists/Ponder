export function unixTimestamp(date) {
  return Math.floor(date ? date.getTime() : Date.now() / 1000);
}

export function episodeId(episode) {
  return `${episode.title}@${episode.publishedAt.getTime()}`;
}

/* Returns true if the given array or object is empty or undefined */
export function isEmpty(obj) {
  return (typeof obj !== 'object' || Object.keys(obj).length === 0);
}

export function corsApiHeaders() {
  switch (corsProxyURL()) {
    case 'https://cors.bridged.cc/':
      /* See: https://github.com/gridaco/base/issues/23 */
      return {'x-cors-grida-api-key': 'MyAPIKey'};
    default:
      return {};
  }
}

export function corsProxyURL() {
  return 'https://cors-anywhere.herokuapp.com/';
}

export function withCorsProxy(url) {
  return corsProxyURL() + url;
}