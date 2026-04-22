const FIREBASE_API_KEY = 'AIzaSyCXMY-UDoD36xHZEpBUxstflXHzkA2EAe8';
const FIREBASE_LOGIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const btn = loginForm.querySelector('.btn-login');
            const originalText = btn.innerHTML;

            try {
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Authenticating...';
                btn.disabled = true;

                console.log('[Login] Authenticating via Firebase:', email);

                // Call Firebase Identity Toolkit REST API
                const response = await fetch(FIREBASE_LOGIN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        returnSecureToken: true
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Firebase returns error in data.error.message
                    const msg = data?.error?.message || 'Authentication failed';
                    throw new Error(msg);
                }

                // Firebase returns `idToken` — store it for all API calls
                const token = data.idToken;
                if (!token) throw new Error('No token received from Firebase.');

                apiClient.setToken(token);
                console.log('[Login] Firebase auth successful. Redirecting...');

                // Redirect to dashboard
                window.location.href = 'index.html';

            } catch (error) {
                console.error('[Login] Failed:', error.message);

                let friendlyMsg = 'Login failed. Please check your credentials.';
                if (error.message.includes('EMAIL_NOT_FOUND')) friendlyMsg = 'Email not found.';
                if (error.message.includes('INVALID_PASSWORD')) friendlyMsg = 'Wrong password.';
                if (error.message.includes('USER_DISABLED')) friendlyMsg = 'This account has been disabled.';
                if (error.message.includes('TOO_MANY_ATTEMPTS')) friendlyMsg = 'Too many attempts. Try again later.';

                alert(friendlyMsg);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});
