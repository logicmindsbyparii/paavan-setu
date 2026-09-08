/**
 * Query-string helpers shared by the admin list endpoints.
 */

/**
 * Builds a case-insensitive "contains" matcher from untrusted input.
 *
 * `new RegExp(userInput)` treats the search box as a regex engine: a stray `(`
 * throws a 500, and a pattern like `(a+)+$` can pin the event loop (ReDoS).
 * Escaping every metacharacter makes the input a literal substring match.
 */
function safeRegex(value) {
  const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

/**
 * Normalises `page` / `limit` query params.
 *
 * Both arrive as strings. `.skip((page - 1) * limit)` silently produced NaN for
 * a non-numeric page, and an unbounded `limit` let one request pull the whole
 * collection.
 */
function paginate({ page, limit }, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || defaultLimit));
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

module.exports = { safeRegex, paginate };
