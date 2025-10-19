import NodeCache from 'node-cache';

// stdTTL: 3 seconds will be the default TTL if not specified in .set()
// checkperiod: 1 s (how often to check for expired items)
const appCache = new NodeCache({ stdTTL: 60, checkperiod: 1 });


export default appCache;
