const { db } = require('../firebaseConfig');
const bcrypt = require('bcryptjs');

const COLLECTION = 'admins';

class AdminService {
  // Create a new admin
  async create(adminData) {
    try {
      const { Full_Name, Email, Password, Role, Created_By } = adminData;
      
      // Check if admin already exists
      const existingAdmin = await this.findByEmail(Email);
      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      const newAdmin = {
        Full_Name,
        Email,
        Password: hashedPassword,
        Role: Role || 'admin',
        Created_By: Created_By || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newAdmin);
      
      return {
        ID: docRef.id,
        ...newAdmin,
        Password: undefined
      };
    } catch (error) {
      throw error;
    }
  }

  // Find admin by ID
  async findById(id) {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ID: doc.id,
        ...data,
        Password: undefined
      };
    } catch (error) {
      throw error;
    }
  }

  // Find admin by email
  async findByEmail(email) {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('Email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        ID: doc.id,
        ...doc.data(),
        Password: undefined
      };
    } catch (error) {
      throw error;
    }
  }

  // Find admin by email with password (for authentication)
  async findByEmailWithPassword(email) {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('Email', '==', email)
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

  // Find admin by ID including password (for password change)
  async findByIdWithPassword(id) {
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

  // Get all admins
  async findAll() {
    try {
      const snapshot = await db.collection(COLLECTION).get();
      
      return snapshot.docs.map(doc => ({
        ID: doc.id,
        ...doc.data(),
        Password: undefined
      }));
    } catch (error) {
      throw error;
    }
  }

  // Update admin
  async update(id, updateData) {
    try {
      const { Password, ...otherData } = updateData;
      
      const dataToUpdate = {
        ...otherData,
        updatedAt: new Date().toISOString()
      };

      if (Password) {
        dataToUpdate.Password = await bcrypt.hash(Password, 10);
      }

      await db.collection(COLLECTION).doc(id).update(dataToUpdate);
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete admin
  async delete(id) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new AdminService();
