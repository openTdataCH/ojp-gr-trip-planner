import { Router } from 'express';
import { postOJPXML } from '../controllers/postOJPXML';
import { getHealthCheck } from '../controllers/healthCheck';

const router = Router();

router.post('/ojp', postOJPXML);
router.get('/ojp/health', getHealthCheck);

export default router;
