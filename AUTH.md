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

Sessions last seven days and are invalidated on sign-out. Passwords are hashed with salted scrypt. Roles are loaded from the database on every request, so promotions/demotions apply immediately. Teacher tools and management APIs require a teacher or admin; the admin API requires an admin. Class links now require sign-in and return the user to their link afterward. Student session attendance and chat use the signed-in account identity, and participant lists are hidden from students.

The student dashboard is intentionally deferred. Students return to the homepage after sign-in unless they came from a class link. Email verification, password reset, paid-card enforcement, and per-teacher ownership of learning resources are not implemented in this change. Teachers currently share access to the existing teacher workspace.

## Tests

Start a local MongoDB on port 27017, then run:

```sh
npm run test:auth
```

Tests create and drop their own `SmartTute_auth_test_<pid>` database on localhost. They never use the deployment's CONNECTION_STRING.
