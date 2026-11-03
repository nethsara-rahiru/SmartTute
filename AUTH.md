# Accounts and roles

Run `npm ci` and `npm start` with MongoDB available. `CONNECTION_STRING` selects the database (default: `mongodb://localhost:27017/SmartTute`). Accounts, hashed session tokens, and login rate counters are stored in MongoDB.

- `/auth/?mode=register`: create a student account. Public registration cannot assign roles.
- `/auth/?mode=login`: sign in with email and password.
- `/auth/?mode=profile`: edit your name and profile picture. An initials avatar is used until a photo is uploaded.
- `/admin/`: admins can find a registered account by exact email, promote it to teacher, or return it to student. This does not change paid card access.

## First administrator

Register your own account, then run this command on the server against the same database:

```sh
npm run make-admin -- your-account@example.com
```

This command only upgrades an existing account; it does not create a default password. Admins cannot create other admins through the public API. Keep database and server access restricted.

## Deployment

Set `NODE_ENV=production` and `APP_ORIGIN=https://your-smarttute-domain.example` in production. Serve through HTTPS: production session cookies are Secure, HTTP-only, and SameSite=Lax. All state-changing browser requests must have an Origin matching APP_ORIGIN; API integrations must send the configured Origin too. If using a reverse proxy, set APP_ORIGIN to the public HTTPS origin. Rate limiting uses MongoDB and the connection's IP; it does not trust user-supplied forwarding headers. Behind a proxy, its IP shares the 100-attempt/15-minute limit. Per-email limits are 15 attempts/15 minutes. Adjust proxy trust only for infrastructure you control.

Sessions last seven days and are invalidated on sign-out. Passwords are hashed with salted scrypt. Roles are loaded from the database on every request, so promotions/demotions apply immediately. Teacher tools and management APIs require a teacher or admin; the admin API requires an admin. Class links and class-code entry are public. Guests enter their name and receive an HTTP-only, seven-day guest cookie; the server assigns their participant ID and ignores supplied IDs. Signed-in users join automatically with their profile name, without a name prompt. Attendance and chat use the account or guest-cookie identity, and participant lists are hidden from students and guests.

The student dashboard is intentionally deferred. Students return to the homepage after sign-in unless they came from a class link. Email verification, password reset, paid-card enforcement, and per-teacher ownership of learning resources are not implemented in this change. Teachers currently share access to the existing teacher workspace.

## Tests

Start a local MongoDB on port 27017, then run:

```sh
npm run test:auth
```

Tests create and drop their own `SmartTute_auth_test_<pid>` database on localhost. They never use the deployment's CONNECTION_STRING.

## Shared appearance and page access

`public/theme.css` is the shared Live Class token source (Inter font, blue/purple accents, slate text, surfaces, borders, radii and dark-mode colours). Classroom tools import it through `style.css`; landing and account pages use the same tokens. The landing and account theme buttons persist the same `smarttute_theme` setting as Live Class.

`services/pageAccess.js` centralizes page permissions and supplies the allowed navigation sections through `/api/auth/me`. Students can use the homepage, account/profile pages, and Live Class. Tute Lab/Library, Class Organizer/Library, Session Scheduler/Dashboard, Schedules and Live Chatbox require a teacher or admin. Account management requires an admin. Anonymous visitors may join Live Class without signing in. Teacher/admin page visits still require sign-in, and authenticated users without the role receive a styled HTTP 403 page. Navigation filtering supplements server/API authorization.

All pages use `public/sidebar.js` and `sidebar.css` for the same sidebar component. `/api/auth/me` returns the ordered navigation from `navigationFor` in `services/pageAccess.js`; the component never maintains a second role-based link list. Students see Home and Your profile. Teachers also see Tute Library, Class Library, Class Schedules & Calendar, Session Dashboard and Live Chatbox. Admins additionally see Manage accounts. Guests see Home, Sign up and Sign in. Tute Lab, Class Organizer, Session Scheduler and Live Class remain omitted from sidebar navigation as requested; authorized workflow buttons can still open them. The sidebar uses a modal dialog for keyboard focus management, Escape-to-close and a mobile bottom-sheet layout.
