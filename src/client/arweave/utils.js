const PLURAL_TAG_MAP = {
  category: 'categories',
  keyword: 'keywords',
};
const TAG_EXCLUDES = ['Content-Type', 'Unix-Time'];

// TODO: Move this check up the CI/CD pipeline
// function sanityCheckedTag() {
//   const tag = process.env.TAG_PREFIX;
//   if (!tag || tag === 'undefined' || tag === 'null') {
//    throw new Error('process.env.TAG_PREFIX is not set up. Please contact our development team.');
//   }
//   return tag;
// }

export function toTag(name) {
  return TAG_EXCLUDES.includes(name) ? name : `${process.env.TAG_PREFIX}-${name}`;
}

export function fromTag(tagName) {
  const a = tagName.replace(new RegExp(`^${process.env.TAG_PREFIX}-`), '');
  return PLURAL_TAG_MAP[a] || a;
}
