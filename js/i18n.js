/* ==========================================================================
   i18n — Arabic / English translations for static UI text
   ========================================================================== */
const TRANSLATIONS = {
    en: {
        // Sidebar nav
        nav_dashboard:    'Dashboard',
        nav_patients:     'Patients',
        nav_pharmacists:  'Pharmacists',
        nav_interns:      'Intern Pharmacists',
        nav_pharmacies:   'Pharmacies',
        nav_orders:       'Orders',
        nav_medications:  'Medications',
        nav_reports:      'Reports',
        nav_audit:        'Audit Logs',
        nav_file_review:  'File Reviews',
        nav_notifications:'Global Notifications',
        nav_settings:     'Settings',
        nav_admin_mgmt:   'Admin Management',
        nav_platform:     'Platform Config',
        nav_health:       'System Health',
        nav_backups:      'Backups',
        nav_integrations: 'Integrations',
        nav_logout:       'Logout',
        nav_superadmin:   'SuperAdmin',

        // Topbar
        search_placeholder: 'Search everywhere...',

        // Common
        btn_save:    'Save',
        btn_cancel:  'Cancel',
        btn_close:   'Close',
        btn_approve: 'Approve',
        btn_reject:  'Reject',
        btn_view:    'View',
        btn_edit:    'Edit',
        btn_delete:  'Delete',
        btn_refresh: 'Refresh',
        btn_export:  'Export',
        btn_filter:  'Filter',
        btn_search:  'Search',
        btn_suspend: 'Suspend',
        btn_activate:'Activate',
        btn_ban:     'Ban User',

        // Patients page
        page_patients_title: 'Patients Management',
        page_patients_sub:   'View and manage all registered patients.',
        col_name:    'Name',
        col_email:   'Email',
        col_phone:   'Phone',
        col_status:  'Status',
        col_joined:  'Joined',
        col_actions: 'Actions',
        col_limit:   'Prescription Limit',

        // Pharmacists
        page_pharmacists_title: 'Pharmacists Management',
        page_pharmacists_sub:   'Manage pharmacist accounts and applications.',
        tab_all:      'All',
        tab_pending:  'Pending',
        tab_approved: 'Approved',
        tab_rejected: 'Rejected',

        // Interns
        page_interns_title: 'Intern Pharmacists',
        page_interns_sub:   'Manage intern pharmacist applications.',

        // Pharmacies
        page_pharmacies_title: 'Pharmacies Management',
        page_pharmacies_sub:   'Manage registered pharmacies.',

        // Orders
        page_orders_title: 'Orders',
        page_orders_sub:   'View and track all prescription orders.',

        // Medications
        page_medications_title: 'Medications',
        page_medications_sub:   'Browse the medications catalog.',

        // Reports
        page_reports_title: 'Reports & Analytics',
        page_reports_sub:   'Platform performance and statistics.',

        // Audit logs
        page_audit_title: 'Audit Logs',
        page_audit_sub:   'Track all admin activity and system events.',

        // Settings
        page_settings_title: 'Settings',
        page_settings_sub:   'Configure your account and platform preferences.',

        // Notifications
        notif_title:  'Notifications',
        notif_empty:  'No new notifications.',
        notif_failed: 'Failed to load notifications.',

        // Pagination
        pagination_showing: 'Showing',
        pagination_of:      'of',
        pagination_entries: 'entries',

        // Status
        status_active:    'Active',
        status_suspended: 'Suspended',
        status_banned:    'Banned',
        status_pending:   'Pending',
        status_approved:  'Approved',
        status_rejected:  'Rejected',

        // Dashboard
        dash_title:           'Admin Dashboard',
        dash_sub:             'Welcome back! Here\'s what\'s happening today.',
        dash_total_patients:  'Total Patients',
        dash_pharmacists:     'Pharmacists',
        dash_interns:         'Intern Pharmacists',
        dash_pharmacies:      'Pharmacies',
        dash_orders:          'Total Orders',
    },

    ar: {
        // Sidebar nav
        nav_dashboard:    'لوحة التحكم',
        nav_patients:     'المرضى',
        nav_pharmacists:  'الصيادلة',
        nav_interns:      'صيادلة التدريب',
        nav_pharmacies:   'الصيدليات',
        nav_orders:       'الطلبات',
        nav_medications:  'الأدوية',
        nav_reports:      'التقارير',
        nav_audit:        'سجل المراقبة',
        nav_file_review:  'مراجعة الملفات',
        nav_notifications:'الإشعارات العامة',
        nav_settings:     'الإعدادات',
        nav_admin_mgmt:   'إدارة المشرفين',
        nav_platform:     'إعدادات المنصة',
        nav_health:       'صحة النظام',
        nav_backups:      'النسخ الاحتياطية',
        nav_integrations: 'التكاملات',
        nav_logout:       'تسجيل الخروج',
        nav_superadmin:   'مشرف أعلى',

        // Topbar
        search_placeholder: 'البحث في كل مكان...',

        // Common
        btn_save:    'حفظ',
        btn_cancel:  'إلغاء',
        btn_close:   'إغلاق',
        btn_approve: 'قبول',
        btn_reject:  'رفض',
        btn_view:    'عرض',
        btn_edit:    'تعديل',
        btn_delete:  'حذف',
        btn_refresh: 'تحديث',
        btn_export:  'تصدير',
        btn_filter:  'فلترة',
        btn_search:  'بحث',
        btn_suspend: 'تعليق',
        btn_activate:'تفعيل',
        btn_ban:     'حظر المستخدم',

        // Patients page
        page_patients_title: 'إدارة المرضى',
        page_patients_sub:   'عرض وإدارة جميع المرضى المسجلين.',
        col_name:    'الاسم',
        col_email:   'البريد الإلكتروني',
        col_phone:   'الهاتف',
        col_status:  'الحالة',
        col_joined:  'تاريخ الانضمام',
        col_actions: 'الإجراءات',
        col_limit:   'حد الوصفات',

        // Pharmacists
        page_pharmacists_title: 'إدارة الصيادلة',
        page_pharmacists_sub:   'إدارة حسابات وطلبات الصيادلة.',
        tab_all:      'الكل',
        tab_pending:  'قيد الانتظار',
        tab_approved: 'مقبول',
        tab_rejected: 'مرفوض',

        // Interns
        page_interns_title: 'صيادلة التدريب',
        page_interns_sub:   'إدارة طلبات صيادلة التدريب.',

        // Pharmacies
        page_pharmacies_title: 'إدارة الصيدليات',
        page_pharmacies_sub:   'إدارة الصيدليات المسجلة.',

        // Orders
        page_orders_title: 'الطلبات',
        page_orders_sub:   'عرض وتتبع جميع طلبات الوصفات.',

        // Medications
        page_medications_title: 'الأدوية',
        page_medications_sub:   'تصفح قاعدة بيانات الأدوية.',

        // Reports
        page_reports_title: 'التقارير والتحليلات',
        page_reports_sub:   'إحصائيات وأداء المنصة.',

        // Audit logs
        page_audit_title: 'سجل المراقبة',
        page_audit_sub:   'تتبع جميع نشاطات المشرفين وأحداث النظام.',

        // Settings
        page_settings_title: 'الإعدادات',
        page_settings_sub:   'إعداد حسابك وتفضيلات المنصة.',

        // Notifications
        notif_title:  'الإشعارات',
        notif_empty:  'لا توجد إشعارات جديدة.',
        notif_failed: 'فشل تحميل الإشعارات.',

        // Pagination
        pagination_showing: 'عرض',
        pagination_of:      'من',
        pagination_entries: 'سجل',

        // Status
        status_active:    'نشط',
        status_suspended: 'موقوف',
        status_banned:    'محظور',
        status_pending:   'قيد الانتظار',
        status_approved:  'مقبول',
        status_rejected:  'مرفوض',

        // Dashboard
        dash_title:          'لوحة تحكم المشرف',
        dash_sub:            'مرحبًا! إليك ما يحدث اليوم.',
        dash_total_patients: 'إجمالي المرضى',
        dash_pharmacists:    'الصيادلة',
        dash_interns:        'صيادلة التدريب',
        dash_pharmacies:     'الصيدليات',
        dash_orders:         'إجمالي الطلبات',
    }
};

function t(key) {
    const lang = document.documentElement.getAttribute('data-lang') || 'en';
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['en'][key] || key;
}

// Apply all [data-i18n] attributes on the page
function applyTranslations() {
    const lang = document.documentElement.getAttribute('data-lang') || 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr');
        const val = t(key);
        if (attr) {
            el.setAttribute(attr, val);
        } else {
            el.textContent = val;
        }
    });
}
