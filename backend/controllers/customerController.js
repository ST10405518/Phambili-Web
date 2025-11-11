// backend/controllers/customerController.js - Firebase version
const customerService = require('../firebase-services/customerService');
const bcrypt = require('bcryptjs');


exports.getProfile = async (req, res) => {
  try {
    console.log('GET /api/customer/profile called for user:', req.user.id);
    
    const customer = await customerService.findById(req.user.id);
    
    if (!customer) {
      console.log('Customer not found for ID:', req.user.id);
      return res.status(404).json({ message: 'Customer not found.' });
    }
    
    console.log('Customer found:', customer.Full_Name);
    res.json(customer);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { Full_Name, Email, Phone, Address, City, State, ZipCode } = req.body;
  
  try {
    console.log('PUT /api/customer/profile called for user:', req.user.id);
    console.log('Update data:', req.body);
    
    const customer = await customerService.findById(req.user.id);
    if (!customer) {
      console.log('Customer not found for update');
      return res.status(404).json({ message: 'Customer not found.' });
    }
    
    // Prepare update data
    const updateData = {};
    if (Full_Name !== undefined) updateData.Full_Name = Full_Name;
    if (Email !== undefined) updateData.Email = Email;
    if (Phone !== undefined) updateData.Phone = Phone;
    if (Address !== undefined) updateData.Address = Address;
    if (City !== undefined) updateData.City = City;
    if (State !== undefined) updateData.State = State;
    if (ZipCode !== undefined) updateData.ZipCode = ZipCode;
    
    const updatedCustomer = await customerService.update(req.user.id, updateData);
    console.log('Customer updated successfully');
    
    res.json({ message: 'Profile updated successfully.', customer: updatedCustomer });
  } catch (err) {
    console.error('Error in updateProfile:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    console.log('PUT /api/customer/change-password called for user:', req.user.id);
    console.log('Request body:', req.body);

    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password and new password are required.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be at least 6 characters long.' 
      });
    }

    // Find user with password included
    const customer = await customerService.findByIdWithPassword(req.user.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found.' 
      });
    }

    // Debug: Check if customer has a password
    console.log('Customer password exists:', !!customer.Password);
    console.log('Customer password length:', customer.Password?.length);

    // Check if customer has a password set (for users who might not have one)
    if (!customer.Password) {
      return res.status(400).json({ 
        success: false,
        message: 'No password set for this account. Please use password reset instead.' 
      });
    }

    // Verify current password with proper error handling
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(currentPassword, customer.Password);
    } catch (bcryptError) {
      console.error('Bcrypt compare error:', bcryptError);
      return res.status(400).json({ 
        success: false,
        message: 'Error verifying current password. The password format may be invalid.' 
      });
    }

    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password is incorrect.' 
      });
    }

    // Update password (service will hash it)
    await customerService.update(req.user.id, { Password: newPassword });

    console.log('Password changed successfully for user:', req.user.id);

    res.json({ 
      success: true,
      message: 'Password changed successfully.' 
    });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password. Please try again.' 
    });
  }
};