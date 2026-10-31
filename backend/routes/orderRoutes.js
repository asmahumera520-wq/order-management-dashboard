const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getDashboardStats,
  seedOrders,
} = require('../controllers/orderController');

// Dashboard stats
router.get('/stats', getDashboardStats);

// Seed sample data
router.post('/seed', seedOrders);

// CRUD routes
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
