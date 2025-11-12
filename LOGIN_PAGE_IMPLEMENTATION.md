# Adding Direct Password Reset to Login Page

Follow these steps to add the direct password reset functionality to your login page:

## Step 1: Add the Script to login.html

Add the following script tag at the end of your login.html file, right before the closing `</body>` tag:

```html
<!-- Include the simple forgot password implementation -->
<script src="./js/simple-forgot-password-implementation.js"></script>
<script>
  // Initialize the forgot password functionality
  document.addEventListener('DOMContentLoaded', function() {
    if (window.simpleForgotPassword && typeof window.simpleForgotPassword.init === 'function') {
      window.simpleForgotPassword.init();
    }
  });
</script>
```

## Step 2: Verify the "Forgot Password" Link

Make sure your login page has the "Forgot password?" link with the class `auth-forgot`:

```html
<a href="#" class="auth-forgot">Forgot password?</a>
```

This link should be placed above the login button, as it already is in your current login.html file.

## Step 3: Test the Functionality

1. Open the login page
2. Click on "Forgot password?"
3. Enter an email address and click "Verify Account"
4. If the email exists, you'll be able to enter a new password
5. If not, you'll see an error message

That's it! The direct password reset functionality is now integrated into your login page.
