// Sidebar Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const searchBtn = document.querySelector('.search-box i'); // Sometimes used as toggle on mobile

    // Toggle sidebar collapse state
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                // Desktop behavior: collapse horizontally
                sidebar.classList.toggle('close');
            } else {
                // Mobile behavior: slide in/out
                sidebar.classList.toggle('mobile-active');
            }
        });
    }

    // Handle responsive behavior on load and resize
    const handleResize = () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('close'); // Remove desktop collapse class
        } else {
            sidebar.classList.remove('mobile-active'); // Remove mobile overlay class

            // Auto close on smallish desktops (optional, tablet size)
            if (window.innerWidth <= 1024) {
                sidebar.classList.add('close');
            } else {
                sidebar.classList.remove('close');
            }
        }
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-active');
            }
        }
    });

    // Handle active link state based on current URL
    const currentLocation = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.nav-links li a');

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href').split("/").pop();

        // If it's the index or matches the href
        if (currentLocation === linkHref || (currentLocation === "" && linkHref === "index.html")) {
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to current
            link.classList.add('active');
        }
    });

});
