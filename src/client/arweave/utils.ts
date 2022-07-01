const PLURAL_TAG_MAP = {
  category: 'categories',
  keyword: 'keywords',
  episodesKeyword: 'episodesKeywords',
};
const TAG_EXCLUDE_PREFIX = ['Content-Type', 'Unix-Time', 'App-Name', 'App-Version'];

// TODO: Move this check up the CI/CD pipeline
// function sanityCheckedTag() {
//   const tag = process.env.REACT_APP_TAG_PREFIX;
//   if (!tag || tag === 'undefined' || tag === 'null') {
//    throw new Error('process.env.REACT_APP_TAG_PREFIX is not set up.
//    Please contact our development team.');
//   }
//   return tag;
// }

export function toTag(name: string) {
  return TAG_EXCLUDE_PREFIX.includes(name) ? name : `${process.env.REACT_APP_TAG_PREFIX}-${name}`;
}

export function fromTag(tagName: string) {
  const a = tagName.replace(new RegExp(`^${process.env.REACT_APP_TAG_PREFIX}-`), '');
  return PLURAL_TAG_MAP[a as keyof typeof PLURAL_TAG_MAP] || a;
}
