require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
    const email = (process.argv[2] || '').trim().toLowerCase();
    if (!email) throw new Error('Usage: npm run make-admin -- existing-account@example.com');
    await mongoose.connect(process.env.CONNECTION_STRING || 'mongodb://localhost:27017/SmartTute');
    const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { new: true });
    if (!user) throw new Error('Register this account first. No account was changed.');
    console.log('Existing account is now an admin. Sign in and open /admin/.');
}
main().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
