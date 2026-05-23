const router = require('express').Router();
const ctrl = require('../controllers/legalController');

router.get('/', ctrl.list);
router.get('/:key', ctrl.get);

module.exports = router;
