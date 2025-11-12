const { db } = require('../firebaseConfig');
const bcrypt = require('bcryptjs');

const COLLECTION = 'customers';

class CustomerService {
  // Create a new customer
  async create(customerData) {
    try {
      const { Full_Name, Email, Password, Phone, Address } = customerData;
      const normalizedEmail = typeof Email === 'string' ? Email.trim().toLowerCase() : '';
      const trimmedName = typeof Full_Name === 'string' ? Full_Name.trim() : '';
      
      // Check if customer already exists
      const existingCustomer = await this.findByEmail(normalizedEmail);
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      const newCustomer = {
        Full_Name: trimmedName || Full_Name,
        Email: normalizedEmail || Email,
        Password: hashedPassword,
        Phone: Phone || null,
        Address: Address || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection(COLLECTION).add(newCustomer);
      
      return {
        ID: docRef.id,
        ...newCustomer,
        Password: undefined // Don't return password
      };
    } catch (error) {
      throw error;
    }
  }

  // Find customer by ID
  async findById(id) {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) {
        return null;
      }

      const doc = await db.collection(COLLECTION).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ID: doc.id,
        ...data,
        Password: undefined // Don't return password by default
      };
    } catch (error) {
      throw error;
    }
  }

  // Find customer by ID with password (for authentication)
  async findByIdWithPassword(id) {
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

  // Find customer by email
  async findByEmail(email) {
    try {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!normalizedEmail) {
        return null;
      }

      const snapshot = await db.collection(COLLECTION)
        .where('Email', '==', normalizedEmail)
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

  // Find customer by email with password (for authentication)
  async findByEmailWithPassword(email) {
    try {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!normalizedEmail) {
        return null;
      }

      const snapshot = await db.collection(COLLECTION)
        .where('Email', '==', normalizedEmail)
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

  // Get all customers
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

  // Update customer
  async update(id, updateData) {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new Error('Invalid customer ID');
      }

      const { Password, ...otherData } = updateData;
      
      const dataToUpdate = {
        ...otherData,
        updatedAt: new Date().toISOString()
      };

      // If password is being updated, hash it
      if (Password) {
        dataToUpdate.Password = await bcrypt.hash(Password, 10);
      }

      await db.collection(COLLECTION).doc(id).update(dataToUpdate);
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Find customer by ID including password (for password change)
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

  // Delete customer
  async delete(id) {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new Error('Invalid customer ID');
      }

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

module.exports = new CustomerService();
