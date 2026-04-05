const parseJSON = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// Parses all query options from request query string
// Supports:
//   filter  = JSON object  → ?filter={"role":{"$in":["admin"]}}
//   select  = JSON array   → ?select=["name","email"]
//   sort    = JSON object  → ?sort={"name":-1}
//   skip    = number       → ?skip=0
//   limit   = number       → ?limit=10
//   no_limit= 1            → ?no_limit=1  (returns all records)
const parseQueryOptions = (query = {}) => {
  const filter = parseJSON(query.filter, {});
  const select = parseJSON(query.select, []);
  const sort   = parseJSON(query.sort, { createdAt: -1 });
  const skip   = Math.max(0, parseInt(query.skip) || 0);
  const noLimit = parseInt(query.no_limit) === 1;
  const limit  = noLimit ? 0 : Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  // When select fields provided → use inclusion projection only, exclude __v via lean option
  // Mixing -__v (exclusion) with field inclusions causes MongoServerError
  const selectStr = select.length > 0 ? select.join(' ') : '-__v';

  return { filter, select, sort, skip, limit, noLimit, selectStr };
};

const buildMeta = ({ skip, limit, count, total, filter, select, sort }) => ({
  skip,
  limit,
  count,
  total,
  filter,
  select,
  sort,
});

const paginatedResponse = (data, total, options) => ({
  meta: buildMeta({
    skip: options.skip,
    limit: options.limit,
    count: data.length,
    total,
    filter: options.filter,
    select: options.select,
    sort: options.sort,
  }),
  data,
});

module.exports = { parseQueryOptions, paginatedResponse };
