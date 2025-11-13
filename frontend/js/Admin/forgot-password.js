/**
 * Handles admin "forgot password" - redirects to admin dashboard
 * Admins don't have addresses, so they need another admin to reset their password
 */

(function () {
  const modal = document.getElementById('forgotPasswordModal');
  const openLink = document.getElementById('openForgotModal');
  const closeBtn = document.getElementById('forgotModalClose');
  const verificationForm = document.getElementById('forgotPasswordForm');
  const resetForm = document.getElementById('resetPasswordForm');
  const messageEl = document.getElementById('forgotFormMessage');
  const modalTitle = document.getElementById('forgotModalTitle');
  const modalDescription = document.getElementById('forgotModalDescription');

  let isAdminContext = false;

  function showModal() {
    if (!modal) return;
    
    // Check if this is admin context (admin login page)
    isAdminContext = window.location.pathname.includes('admin') || 
                     document.title.includes('Admin') ||
                     document.querySelector('.admin-login-form');
    
    if (isAdminContext) {
      showAdminForgotPasswordMessage();
    } else {
      modal.style.display = 'block';
      resetToVerificationStep();
    }
  }
  
  function hideModal() {
    if (!modal) return;
    modal.style.display = 'none';
    resetToVerificationStep();
  }

  function showAdminForgotPasswordMessage() {
    // Show admin-specific message
    modal.style.display = 'block';
    verificationForm.style.display = 'none';
    resetForm.style.display = 'none';
    
    modalTitle.textContent = 'Admin Password Reset';
    modalDescription.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <i class="fas fa-user-shield" style="font-size: 3rem; color: #007bff; margin-bottom: 1rem;"></i>
        <h3>Admin Password Reset Required</h3>
        <p style="margin: 1rem 0; color: #666;">
          Admin passwords can only be reset by other administrators for security reasons.
        </p>
        <p style="margin: 1rem 0; font-weight: 600;">
          Please contact another admin to reset your password through the Admin Dashboard.
        </p>
        <div style="margin: 2rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
          <strong>Steps for password reset:</strong>
          <ol style="text-align: left; margin: 0.5rem 0; padding-left: 1.5rem;">
            <li>Contact another administrator</li>
            <li>Ask them to log into the Admin Dashboard</li>
            <li>They can reset your password in Admin Management</li>
            <li>Use the temporary password they provide</li>
          </ol>
        </div>
        <button class="btn btn-primary" onclick="window.location.href='admin-dashboard.html'" style="margin-right: 1rem;">
          <i class="fas fa-external-link-alt"></i> Go to Admin Dashboard
        </button>
        <button class="btn btn-secondary" onclick="hideModal()">
          <i class="fas fa-times"></i> Close
        </button>
      </div>
    `;
    messageEl.textContent = '';
  }

  function resetToVerificationStep() {
    if (verificationForm) verificationForm.style.display = 'block';
    if (resetForm) resetForm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Forgot Password';
    if (modalDescription) modalDescription.textContent = 'Enter your email and full address to verify your identity.';
    if (messageEl) messageEl.textContent = '';
    if (verificationForm) verificationForm.reset();
    if (resetForm) resetForm.reset();
  }

  function showPasswordResetStep() {
    verificationForm.style.display = 'none';
    resetForm.style.display = 'block';
    modalTitle.textContent = 'Reset Password';
    modalDescription.textContent = 'Identity verified! Please enter your new password.';
    messageEl.textContent = '';
  }

  if (openLink) {
    openLink.addEventListener('click', (e) => {
      e.preventDefault();
      showModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', hideModal);
  }
  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  async function postJSON(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    return res.json();
  }

  // Step 1: Address verification
  verificationForm && verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.textContent = '';
    
    const email = document.getElementById('fpEmail').value.trim();
    const street = document.getElementById('fpStreet').value.trim();
    const city = document.getElementById('fpCity').value.trim();
    const state = document.getElementById('fpState').value.trim();
    const postal = document.getElementById('fpPostal').value.trim();

    if (!email || !street || !city || !state || !postal) {
      messageEl.textContent = 'Please fill all fields.';
      return;
    }

    const payload = {
      email,
      address: {
        Address_Street: street,
        Address_City: city,
        Address_State: state,
        Address_Postal_Code: postal
      }
    };

    try {
      messageEl.textContent = 'Verifying identity...';
      const resp = await postJSON('/auth/forgot-password', payload);
      
      if (resp.success && resp.verificationToken) {
        verificationToken = resp.verificationToken;
        userEmail = resp.email;
        showPasswordResetStep();
      } else {
        messageEl.textContent = resp.message || 'Verification failed. Please check your information.';
      }
    } catch (err) {
      console.error('Address verification failed', err);
      messageEl.textContent = 'Server error, please try again later.';
    }
  });

  // Step 2: Password reset (only for customers, not admins)
  resetForm && resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Skip if admin context
    if (isAdminContext) {
      return;
    }
    
    messageEl.textContent = '';

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!newPassword || !confirmPassword) {
      messageEl.textContent = 'Please fill all password fields.';
      return;
    }

    if (newPassword.length < 6) {
      messageEl.textContent = 'Password must be at least 6 characters long.';
      return;
    }

    if (newPassword !== confirmPassword) {
      messageEl.textContent = 'Passwords do not match.';
      return;
    }

    const payload = {
      email: userEmail,
      verificationToken: verificationToken,
      newPassword: newPassword
    };

    try {
      messageEl.textContent = 'Resetting password...';
      const resp = await postJSON('/auth/reset-password-verified', payload);
      
      if (resp.success) {
        messageEl.textContent = 'Password reset successfully! You can now log in with your new password.';
        setTimeout(() => {
          hideModal();
        }, 3000);
      } else {
        messageEl.textContent = resp.message || 'Password reset failed. Please try again.';
      }
    } catch (err) {
      console.error('Password reset failed', err);
      messageEl.textContent = 'Server error, please try again later.';
    }
  });

  // Make hideModal globally available for the admin message buttons
  window.hideModal = hideModal;
})();