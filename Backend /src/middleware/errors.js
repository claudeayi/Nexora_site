export function notFound(_req, res) {
  res.status(404).json({ error: 'not_found' });
}

export function errorHandler(err, _req, res, _next) {
  console.error('[Error]', err?.message || err);
  res.status(err.status || 500).json({ error: 'server_error' });
}
