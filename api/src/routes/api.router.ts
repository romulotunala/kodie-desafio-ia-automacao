import { Router } from 'express';

import { classifyRouter } from '../modules/classify/classify.route.js';

/** Business endpoints, mounted under API_PREFIX. Adding a case = one `use` line here. */
export const apiRouter = Router();

apiRouter.use(classifyRouter);
