// routes/maquinas.js — punto de entrada (refactorizado)
const express = require('express');
const router = express.Router();

const categorias   = require('./maquinas/categorias');
const crud         = require('./maquinas/crud');
const movimientos  = require('./maquinas/movimientos');
const incidencias  = require('./maquinas/incidencias');
const puestaPunto  = require('./maquinas/puesta-punto');
const tecnico      = require('./maquinas/tecnico');

router.use(categorias);
router.use(crud);
router.use(movimientos);
router.use(incidencias);
router.use(puestaPunto);
router.use(tecnico);

module.exports = router;
