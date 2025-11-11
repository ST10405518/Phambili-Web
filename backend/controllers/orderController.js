const orderService = require('../firebase-services/orderService');
const customerService = require('../firebase-services/customerService');
const productService = require('../firebase-services/productService');
const paymentService = require('../firebase-services/paymentService');

// Create a new order
exports.createOrder = async (req, res) => {
  const { Customer_ID, Product_ID, Payment_ID, Date } = req.body;
  try {
    const order = await orderService.create({
      Customer_ID,
      Product_ID,
      Payment_ID: Payment_ID || null, // optional
      Date
    });
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await orderService.findAll();
    
    // Populate related data
    for (let order of orders) {
      if (order.Customer_ID) {
        order.Customer = await customerService.findById(order.Customer_ID);
      }
      if (order.Product_ID) {
        order.Product = await productService.findById(order.Product_ID);
      }
      if (order.Payment_ID) {
        order.Payment = await paymentService.findById(order.Payment_ID);
      }
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await orderService.findById(id);
    
    // Populate related data
    if (order) {
      if (order.Customer_ID) {
        order.Customer = await customerService.findById(order.Customer_ID);
      }
      if (order.Product_ID) {
        order.Product = await productService.findById(order.Product_ID);
      }
      if (order.Payment_ID) {
        order.Payment = await paymentService.findById(order.Payment_ID);
      }
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { Customer_ID, Product_ID, Payment_ID, Date } = req.body;
  try {
    const order = await orderService.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updateData = {
      Customer_ID: Customer_ID || order.Customer_ID,
      Product_ID: Product_ID || order.Product_ID,
      Payment_ID: Payment_ID !== undefined ? Payment_ID : order.Payment_ID,
      Date: Date || order.Date
    };

    const updatedOrder = await orderService.update(id, updateData);
    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await orderService.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await orderService.delete(id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
