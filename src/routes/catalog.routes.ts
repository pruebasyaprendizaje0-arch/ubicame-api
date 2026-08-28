import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { catalogController } from '../controllers/catalog.controller';

const router = Router();

// SERVICIOS
router.post('/branches/:branchId/services', requireAuth, catalogController.createService);
router.get('/branches/:branchId/services', catalogController.getBranchServices);
router.put('/services/:serviceId', requireAuth, catalogController.updateService);
router.delete('/services/:serviceId', requireAuth, catalogController.deleteService);

// RECURSOS
router.post('/branches/:branchId/resources', requireAuth, catalogController.createResource);
router.get('/branches/:branchId/resources', catalogController.getBranchResources);
router.put('/resources/:resourceId', requireAuth, catalogController.updateResource);
router.delete('/resources/:resourceId', requireAuth, catalogController.deleteResource);

// PERSONAL (STAFF)
router.post('/branches/:branchId/staff', requireAuth, catalogController.createStaff);
router.get('/branches/:branchId/staff', catalogController.getBranchStaff);
router.put('/staff/:staffId', requireAuth, catalogController.updateStaff);
router.delete('/staff/:staffId', requireAuth, catalogController.deleteStaff);

// DISPONIBILIDAD / HORARIOS
router.get('/branches/:branchId/availability', catalogController.getBranchAvailability);
router.put('/branches/:branchId/availability', requireAuth, catalogController.setBranchAvailability);
router.post('/branches/:branchId/availability/exceptions', requireAuth, catalogController.createAvailabilityException);
router.delete('/branches/:branchId/availability/exceptions/:exceptionId', requireAuth, catalogController.deleteAvailabilityException);

export default router;
