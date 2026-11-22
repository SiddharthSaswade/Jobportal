export function buildPagination({ page, limit, total }) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function getPaginationParams(query) {
  return {
    page: query.page || 1,
    limit: query.limit || 10,
  };
}
