const router = require('express').Router();
const ctrl = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAppointmentRules } = require('../validators/appointmentValidator');

router.use(authenticate);

router.get('/', ctrl.getMyAppointments);
router.post('/', createAppointmentRules, validate, ctrl.create);
router.delete('/:id', ctrl.delete);

module.exports = router;
