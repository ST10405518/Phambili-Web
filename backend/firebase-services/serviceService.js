const { db } = require('../firebaseConfig');

const COLLECTION = 'services';

class ServiceService {
  // Create a new service
  async create(serviceData) {
    try {
      const newService = {
        ...serviceData,
        Name: typeof serviceData.Name === 'string' ? serviceData.Name.trim() : serviceData.Name,
        Description: typeof serviceData.Description === 'string' ? serviceData.Description.trim() : serviceData.Description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newService);
      
      return {
        ID: docRef.id,
        ...newService
      };
    } catch (error) {
      throw error;
    }
  }

  // Find service by ID
  async findById(id) {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) {
        return null;
      }

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

  // Get all services
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

  // Update service
  async update(id, updateData) {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new Error('Invalid service ID');
      }

      const dataToUpdate = {
        ...updateData,
        ...(typeof updateData.Name === 'string' ? { Name: updateData.Name.trim() } : {}),
        ...(typeof updateData.Description === 'string' ? { Description: updateData.Description.trim() } : {}),
        updatedAt: new Date().toISOString()
      };

      await db.collection(COLLECTION).doc(id).update(dataToUpdate);
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete service
  async delete(id) {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new Error('Invalid service ID');
      }

      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ServiceService();
