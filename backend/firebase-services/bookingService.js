const { db } = require('../firebaseConfig');

const COLLECTION = 'bookings';

class BookingService {
  // Create a new booking
  async create(bookingData) {
    try {
      const newBooking = {
        ...bookingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newBooking);
      
      return {
        ID: docRef.id,
        ...newBooking
      };
    } catch (error) {
      throw error;
    }
  }

  // Find booking by ID
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

  // Get all bookings
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

  // Get bookings by customer ID
  async findByCustomerId(customerId) {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('Customer_ID', '==', customerId)
        .get();
      
      return snapshot.docs.map(doc => ({
        ID: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // Get bookings by service ID
  async findByServiceId(serviceId) {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('Service_ID', '==', serviceId)
        .get();
      
      return snapshot.docs.map(doc => ({
        ID: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // Update booking
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

  // Delete booking
  async delete(id) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BookingService();
