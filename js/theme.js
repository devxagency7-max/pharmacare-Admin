/* ==========================================================================
   Theme & Language Controller
   Handles: dark/light mode toggle + Arabic/English switching
   ========================================================================== */
(function () {
    // ── Restore saved prefs immediately (before render) ──────────────────────
    const savedTheme = localStorage.getItem('tamenny_theme') || 'light';
    const savedLang  = localStorage.getItem('tamenny_lang')  || 'en';

    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-lang',  savedLang);
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', savedLang);

    // ── Wire up controls after DOM ready ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        injectControls();
        applyTranslations();
        updateLangBtn();
        updateThemeBtn();
    });

    // ── Inject toggle buttons into every topbar ───────────────────────────────
    function injectControls() {
        const topbarRight = document.querySelector('.topbar-right');
        if (!topbarRight || document.getElementById('theme-controls')) return;

        const wrap = document.createElement('div');
        wrap.className = 'theme-controls';
        wrap.id = 'theme-controls';
        wrap.innerHTML = `
            <button class="theme-btn" id="theme-toggle-btn" title="Toggle dark / light mode">
                <i class="bx bx-moon" id="theme-icon"></i>
            </button>
            <button class="lang-btn" id="lang-toggle-btn" title="Switch language / تغيير اللغة">
                EN
            </button>
        `;

        // Insert before the notification bell (first child)
        topbarRight.insertBefore(wrap, topbarRight.firstChild);

        document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
        document.getElementById('lang-toggle-btn').addEventListener('click',  toggleLang);
    }

    // ── Theme ─────────────────────────────────────────────────────────────────
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('tamenny_theme', next);
        updateThemeBtn();
    }

    function updateThemeBtn() {
        const icon = document.getElementById('theme-icon');
        if (!icon) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        icon.className = isDark ? 'bx bx-sun' : 'bx bx-moon';
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    // ── Language ──────────────────────────────────────────────────────────────
    function toggleLang() {
        const current = document.documentElement.getAttribute('data-lang');
        const next    = current === 'ar' ? 'en' : 'ar';
        setLang(next);
    }

    function setLang(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('dir',  lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('tamenny_lang', lang);
        applyTranslations();
        updateLangBtn();
        // Update search placeholder
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) searchInput.placeholder = t('search_placeholder');
    }

    function updateLangBtn() {
        const btn = document.getElementById('lang-toggle-btn');
        if (!btn) return;
        const isAr = document.documentElement.getAttribute('data-lang') === 'ar';
        btn.textContent = isAr ? 'EN' : 'عربي';
        btn.title = isAr ? 'Switch to English' : 'التبديل إلى العربية';
    }

    // Expose globally so pages can call if needed
    window.setLang  = setLang;
    window.toggleLang  = toggleLang;
    window.toggleTheme = toggleTheme;
})();
