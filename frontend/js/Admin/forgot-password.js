/**
 * Handles the "forgot password" modal with two-step process:
 * 1. Address verification
 * 2. Password reset
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

  let verificationToken = null;
  let userEmail = null;

  function showModal() {
    if (!modal) return;
    modal.style.display = 'block';
    resetToVerificationStep();
  }
  
  function hideModal() {
    if (!modal) return;
    modal.style.display = 'none';
    resetToVerificationStep();
  }

  function resetToVerificationStep() {
    verificationForm.style.display = 'block';
    resetForm.style.display = 'none';
    modalTitle.textContent = 'Forgot Password';
    modalDescription.textContent = 'Enter your email and full address to verify your identity.';
    messageEl.textContent = '';
    verificationForm.reset();
    resetForm.reset();
    verificationToken = null;
    userEmail = null;
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

  // Step 2: Password reset
  resetForm && resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
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

    if (!verificationToken || !userEmail) {
      messageEl.textContent = 'Verification token missing. Please start over.';
      resetToVerificationStep();
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
})();