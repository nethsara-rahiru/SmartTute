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
const navigationItems = [
    { label: 'Home', href: '/', section: '', icon: '⌂' },
    { label: 'Tute Library', href: '/tute_library/', section: 'tute_library', icon: '▤' },
    { label: 'Class Library', href: '/class_library/', section: 'class_library', icon: '▦' },
    { label: 'Class Schedules & Calendar', href: '/schedules/', section: 'schedules', icon: '▦' },
    { label: 'Session Dashboard', href: '/session_dashboard/', section: 'session_dashboard', icon: '▥' },
    { label: 'Live Chatbox', href: '/live_chatbox/', section: 'live_chatbox', icon: '◇' },
    { label: 'Your profile', href: '/auth/?mode=profile', section: 'auth', icon: '○' },
    { label: 'Manage accounts', href: '/admin/', section: 'admin', icon: '⚙' }
];
function navigationFor(user) {
    if (!user) return [navigationItems[0],
        { label: 'Sign up', href: '/auth/?mode=register', icon: '+' },
        { label: 'Sign in', href: '/auth/?mode=login', icon: '→' }];
    const allowed = allowedSections(user);
    return navigationItems.filter(item => allowed.includes(item.section));
}
module.exports = { allowedSections, requiredRoles, teacherSections, navigationFor };
