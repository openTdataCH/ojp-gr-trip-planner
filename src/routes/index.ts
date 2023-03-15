import { Router } from 'express';
import { postOJPXML } from '../controllers/postOJPXML';
import { getHealthCheck } from '../controllers/healthCheck';

const router = Router();

router.post('/testXML', postOJPXML);
router.get('/testXML/health', getHealthCheck);

export default router;
