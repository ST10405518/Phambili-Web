const { db } = require('../firebaseConfig');

const COLLECTION = 'payments';

class PaymentService {
  // Create a new payment
  async create(paymentData) {
    try {
      const newPayment = {
        ...paymentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newPayment);
      
      return {
        ID: docRef.id,
        ...newPayment
      };
    } catch (error) {
      throw error;
    }
  }

  // Find payment by ID
  async findById(id) {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        ID: doc.id,
        ...doc.data()
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all payments
  async findAll() {
    try {
      const snapshot = await db.collection(COLLECTION).get();
      
      return snapshot.docs.map(doc => ({
        ID: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // Get payment by booking ID
  async findByBookingId(bookingId) {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('Booking_ID', '==', bookingId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        ID: doc.id,
        ...doc.data()
      };
    } catch (error) {
      throw error;
    }
  }

  // Update payment
  async update(id, updateData) {
    try {
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await db.collection(COLLECTION).doc(id).update(dataToUpdate);
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete payment
  async delete(id) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaymentService();
