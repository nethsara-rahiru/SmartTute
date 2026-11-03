// Keep page authorization and the navigation exposed to each account in sync.
const teacherSections = ['tute_library', 'tute_lab', 'class_library', 'class_organizer', 'session_scheduler', 'session_dashboard', 'schedules', 'live_chatbox'];
const studentSections = ['', 'index.html', 'auth', 'live_class'];
function allowedSections(user) {
    // Guests may follow a class link; the page guard asks them to sign in first.
    if (!user) return [...studentSections];
    const sections = [...studentSections];
    if (['teacher', 'admin'].includes(user.role)) sections.push(...teacherSections);
    if (user.role === 'admin') sections.push('admin');
    return sections;
}
function requiredRoles(section) {
    if (section === 'admin') return ['admin'];
    if (teacherSections.includes(section)) return ['teacher', 'admin'];
    return null;
}
module.exports = { allowedSections, requiredRoles, teacherSections };
