import RssParser from 'rss-parser/dist/rss-parser.min';
import { corsApiHeaders } from '../../utils';

const rssParser = new RssParser({headers: corsApiHeaders()});
export default rssParser;
