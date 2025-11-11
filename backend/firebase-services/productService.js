const { db } = require('../firebaseConfig');

const COLLECTION = 'products';

class ProductService {
  // Create a new product
  async create(productData) {
    try {
      const newProduct = {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newProduct);
      
      return {
        ID: docRef.id,
        ...newProduct
      };
    } catch (error) {
      throw error;
    }
  }

  // Find product by ID
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

  // Get all products
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

  // Update product
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

  // Delete product
  async delete(id) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductService();
