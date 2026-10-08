import { Router } from 'express';

export function logsRouter({ logger }) {
  const router = Router();

  router.get('/', (req, res) => {
    const afterId = Number(req.query.after) || 0;
    const result = logger.getEntries(afterId);
    res.json(result);
  });

  return router;
}
