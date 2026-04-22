document.addEventListener('DOMContentLoaded', () => {
    loadSettingsData();
    initSettingsActions();
});

async function loadSettingsData() {
    console.log('[Settings] Loading admin profile...');
    try {
        const profile = await fetchAdminProfile();
        if (profile) {
            const firstName = document.getElementById('settings-first-name');
            const lastName = document.getElementById('settings-last-name');
            const email = document.getElementById('settings-email');
            const phone = document.getElementById('settings-phone');

            if (firstName) firstName.value = profile.firstName || profile.first_name || profile.name?.split(' ')[0] || '';
            if (lastName) lastName.value = profile.lastName || profile.last_name || profile.name?.split(' ')[1] || '';
            if (email) email.value = profile.email || '';
            if (phone) phone.value = profile.phone || profile.phoneNumber || '';
        }
    } catch (error) {
        console.error('[Settings] Error loading profile:', error);
    }
}

function initSettingsActions() {
    const saveBtn = document.querySelector('.btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const data = {
                firstName: document.getElementById('settings-first-name').value,
                lastName: document.getElementById('settings-last-name').value,
                phone: document.getElementById('settings-phone').value
            };

            try {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
                saveBtn.disabled = true;

                await updateAdminProfile(data);
                
                Swal.fire({
                    title: 'Profile Updated!',
                    text: 'Your account information has been saved successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Update topbar name if needed
                const topName = document.querySelector('.topbar .name');
                if (topName) topName.textContent = `${data.firstName} ${data.lastName}`;

                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            } catch (err) {
                Swal.fire('Error', 'Failed to update profile: ' + err.message, 'error');
                saveBtn.disabled = false;
            }
        });
    }

    // Toggle logic for system preferences
    const toggles = document.querySelectorAll('.switch input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', async () => {
            const label = toggle.closest('.toggle-switch').querySelector('label').textContent;
            try {
                // In a real scenario, we'd send specific keys, for now generic sync
                const settingsPayload = {}; // Build based on which toggle changed
                await updateSettings(settingsPayload);
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                
                Toast.fire({
                    icon: 'success',
                    title: `${label} applied.`
                });
            } catch (err) {
                toggle.checked = !toggle.checked; // Revert
                Swal.fire('Sync Error', 'Could not apply system preference.', 'error');
            }
        });
    });

    // Toggle logic for settings nav
    const navItems = document.querySelectorAll('.settings-nav li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            if (item.textContent.includes('Security')) {
                Swal.fire('Security Settings', 'Password change and 2FA management coming soon in the next update.', 'info');
            }
        });
    });
}
