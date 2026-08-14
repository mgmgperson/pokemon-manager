import { Router } from 'express';
import {
  getFinanceStatus,
  listTransactionCategories,
  listTransactions,
} from './finance.controller';

const router: Router = Router();

router.get('/status', getFinanceStatus);
router.get('/transactions', listTransactions);
router.get('/categories', listTransactionCategories);

export default router;
