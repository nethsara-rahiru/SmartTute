const { randomBytes, scrypt: derive, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(derive);

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const key = await scrypt(password, salt, 64);
    return `${salt}:${key.toString('hex')}`;
}

async function verifyPassword(password, hash) {
    const [salt, hex] = hash.split(':');
    const key = await scrypt(password, salt, 64);
    const expected = Buffer.from(hex, 'hex');
    return key.length === expected.length && timingSafeEqual(key, expected);
}

module.exports = { hashPassword, verifyPassword };
