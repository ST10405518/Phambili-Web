const { db } = require('../firebaseConfig');

const COLLECTION = 'gallery';

class GalleryService {
  // Create a new gallery item
  async create(galleryData) {
    try {
      const newGalleryItem = {
        ...galleryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newGalleryItem);
      
      return {
        ID: docRef.id,
        ...newGalleryItem
      };
    } catch (error) {
      throw error;
    }
  }

  // Find gallery item by ID
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

  // Get all gallery items
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

  // Update gallery item
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

  // Delete gallery item
  async delete(id) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new GalleryService();
