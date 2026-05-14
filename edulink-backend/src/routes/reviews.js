const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

router.get('/:teacherId', ctrl.getByTeacher);
router.get('/', authenticate, ctrl.getMyReviews);

module.exports = router;
