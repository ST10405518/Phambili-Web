const { db } = require('../firebaseConfig');

const COLLECTION = 'orders';

class OrderService {
  // Create a new order
  async create(orderData) {
    try {
      const newOrder = {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newOrder);
      
      return {
        ID: docRef.id,
        ...newOrder
      };
    } catch (error) {
      throw error;
    }
  }

  // Find order by ID
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

  // Get all orders
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

  // Get orders by customer ID
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

  // Get orders by product ID
  async findByProductId(productId) {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('Product_ID', '==', productId)
        .get();
      
      return snapshot.docs.map(doc => ({
        ID: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // Update order
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

  // Delete order
  async delete(id) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrderService();
