const express = require('express');
const router = express.Router();
const { registrar, login, loginConFirebase } = require('../controllers/auth.controller');

router.post('/registrar', registrar);

router.post('/login', login);

router.post('/firebase', loginConFirebase);

module.exports = router;
