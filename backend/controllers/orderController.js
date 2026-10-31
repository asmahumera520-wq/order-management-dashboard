const Order = require('../models/Order');

// ─── GET ALL ORDERS ──────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {};

    if (search) {
      filter.customerName = { $regex: search, $options: 'i' };
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ORDER ─────────────────────────────────────────────────────────────
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ORDER ─────────────────────────────────────────────────────────────
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ status: 'Pending' });
    const processing = await Order.countDocuments({ status: 'Processing' });
    const delivered = await Order.countDocuments({ status: 'Delivered' });
    const cancelled = await Order.countDocuments({ status: 'Cancelled' });

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: { total, pending, processing, delivered, cancelled, totalRevenue, recentOrders },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SEED SAMPLE DATA ─────────────────────────────────────────────────────────
const seedOrders = async (req, res) => {
  try {
    const existing = await Order.countDocuments();
    if (existing > 0) {
      return res.status(200).json({ success: true, message: 'Data already exists' });
    }

    const sampleOrders = [
      { customerName: 'Rahul Sharma', productName: 'Laptop HP Pavilion', quantity: 1, price: 55000, status: 'Delivered', orderDate: new Date('2024-01-05') },
      { customerName: 'Priya Patel', productName: 'Samsung Galaxy S23', quantity: 2, price: 74999, status: 'Pending', orderDate: new Date('2024-01-10') },
      { customerName: 'Amit Kumar', productName: 'Sony WH-1000XM5 Headphones', quantity: 1, price: 29990, status: 'Processing', orderDate: new Date('2024-01-12') },
      { customerName: 'Sneha Reddy', productName: 'LG 55" OLED TV', quantity: 1, price: 120000, status: 'Delivered', orderDate: new Date('2024-01-15') },
      { customerName: 'Vikram Singh', productName: 'Apple iPhone 15 Pro', quantity: 1, price: 134900, status: 'Cancelled', orderDate: new Date('2024-01-18') },
      { customerName: 'Anjali Gupta', productName: 'Dell Monitor 27"', quantity: 2, price: 22000, status: 'Pending', orderDate: new Date('2024-01-20') },
      { customerName: 'Rohan Mehta', productName: 'Logitech MX Master 3', quantity: 3, price: 9000, status: 'Delivered', orderDate: new Date('2024-01-22') },
      { customerName: 'Pooja Nair', productName: 'Canon DSLR EOS 200D', quantity: 1, price: 43000, status: 'Processing', orderDate: new Date('2024-01-25') },
      { customerName: 'Kiran Joshi', productName: 'iPad Air 5th Gen', quantity: 1, price: 59900, status: 'Delivered', orderDate: new Date('2024-01-28') },
      { customerName: 'Deepak Verma', productName: 'Boat Rockerz 450', quantity: 4, price: 1499, status: 'Pending', orderDate: new Date('2024-02-01') },
      { customerName: 'Nisha Agarwal', productName: 'HP LaserJet Printer', quantity: 1, price: 14000, status: 'Delivered', orderDate: new Date('2024-02-04') },
      { customerName: 'Suresh Pillai', productName: 'Acer Predator Gaming Chair', quantity: 1, price: 25000, status: 'Cancelled', orderDate: new Date('2024-02-06') },
      { customerName: 'Meena Krishnan', productName: 'Philips Air Fryer', quantity: 2, price: 7500, status: 'Processing', orderDate: new Date('2024-02-08') },
      { customerName: 'Arjun Bose', productName: 'Mi Smart Band 8', quantity: 5, price: 3499, status: 'Pending', orderDate: new Date('2024-02-10') },
      { customerName: 'Divya Choudhary', productName: 'JBL Flip 6 Speaker', quantity: 2, price: 11999, status: 'Delivered', orderDate: new Date('2024-02-12') },
    ];

    await Order.insertMany(sampleOrders);
    res.status(201).json({ success: true, message: '15 sample orders seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getDashboardStats, seedOrders };
