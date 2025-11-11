const paymentService = require('../firebase-services/paymentService');
const bookingService = require('../firebase-services/bookingService');

// Create a new payment
exports.createPayment = async (req, res) => {
  const { Booking_ID, Date, Amount, Method, Status } = req.body;
  try {
    const payment = await paymentService.create({
      Booking_ID: Booking_ID || null,
      Date,
      Amount,
      Method,
      Status
    });
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await paymentService.findAll();
    
    // Populate booking data
    for (let payment of payments) {
      if (payment.Booking_ID) {
        payment.Booking = await bookingService.findById(payment.Booking_ID);
      }
    }
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await paymentService.findById(id);
    
    // Populate booking data
    if (payment && payment.Booking_ID) {
      payment.Booking = await bookingService.findById(payment.Booking_ID);
    }
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a payment
exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const { Booking_ID, Date, Amount, Method, Status } = req.body;
  try {
    const payment = await paymentService.findById(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const updateData = {
      Booking_ID: Booking_ID !== undefined ? Booking_ID : payment.Booking_ID,
      Date: Date || payment.Date,
      Amount: Amount || payment.Amount,
      Method: Method || payment.Method,
      Status: Status || payment.Status
    };

    const updatedPayment = await paymentService.update(id, updateData);
    res.json({ message: 'Payment updated successfully', payment: updatedPayment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await paymentService.findById(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await paymentService.delete(id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
