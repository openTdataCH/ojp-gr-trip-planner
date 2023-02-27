import { Router } from 'express';
import { postOJPXML } from '@/controllers/postOJPXML';

const router = Router();

router.post('/testXML', postOJPXML);

export default router;
