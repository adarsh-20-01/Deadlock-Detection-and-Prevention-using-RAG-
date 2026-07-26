import express from 'express';
import {
  verifyState,
  saveSimulation,
  getSimulations,
  loadSimulation,
  deleteSimulation
} from '../controllers/simulationController.js';

const router = express.Router();

router.post('/verify', verifyState);
router.post('/save', saveSimulation);
router.get('/list', getSimulations);
router.get('/:id', loadSimulation);
router.delete('/:id', deleteSimulation);

export default router;
