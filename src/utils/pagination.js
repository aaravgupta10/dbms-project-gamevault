// (5) Pagination and Sorting helper shared by list endpoints
const paginate = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort ? query.sort.split(',').join(' ') : '-createdAt';
  return { page, limit, skip, sort };
};

module.exports = paginate;
