/*
 * User seed script.
 * WARNING: This will DROP the existing users collection and recreate sample accounts.
 * Usage (PowerShell from backend directory):
 *   $env:MONGO_URI="mongodb://localhost:27017/yourdb"  # if not already in .env
 *   node scripts/seedUsers.js
 *
 * Accounts created (adjust as needed):
 *   Administrator: admin@example.com / Admin!2025Secure
 *   Manager: manager@example.com / Manager!2025Secure
 *   Guest: guest@example.com / Guest!2025Secure
 *   Security Q/A required by UserModel are included for each user.
 *
 * Passwords comply with current policy (length >= minLength, upper, lower, digit, special, no spaces).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const { validatePassword, describePolicy, getPolicy } = require('../utils/passwordPolicy');

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set. Set in .env or environment before running.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');

  const sampleUsers = [
    { 
      email: 'admin@example.com', 
      password: 'Admin!2025Secure', 
      role: 'Administrator',
      securityQuestion: 'What is the Most memorable moment?',
      securityAnswer: 'Blue',
      lastPasswordChange: new Date(Date.now() - 48 * 3600000), // 48h ago
      lastUseAt: new Date(Date.now() - 6 * 3600000), // simulate last use 6h ago
      lastSuccessfulLoginAt: new Date(Date.now() - 6 * 3600000),
      lastFailedLoginAt: null
    },
    { 
      email: 'manager@example.com', 
      password: 'Manager!2025Secure', 
      role: 'Manager',
      securityQuestion: 'What is the Most memorable moment?',
      securityAnswer: 'Green',
      lastPasswordChange: new Date(Date.now() - 48 * 3600000),
      lastUseAt: new Date(Date.now() - 12 * 3600000), // 12h ago
      lastSuccessfulLoginAt: new Date(Date.now() - 12 * 3600000),
      lastFailedLoginAt: null
    },
    { 
      email: 'guest@example.com', 
      password: 'Guest!2025Secure', 
      role: 'Guest',
      securityQuestion: 'What is the Most memorable moment?',
      securityAnswer: 'Yellow',
      lastPasswordChange: new Date(Date.now() - 48 * 3600000),
      lastUseAt: new Date(Date.now() - 24 * 3600000), // 24h ago
      lastSuccessfulLoginAt: new Date(Date.now() - 24 * 3600000),
      lastFailedLoginAt: null
    }
  ];

  const policySummary = describePolicy();
  console.log('Password Policy:', policySummary);
  console.log('Policy Config:', getPolicy());

  try {
    const collectionExists = await mongoose.connection.db.listCollections({ name: 'users' }).hasNext();
    if (collectionExists) {
      console.log('Dropping existing users collection...');
      await mongoose.connection.db.dropCollection('users');
      console.log('Dropped.');
    } else {
      console.log('Users collection does not exist; nothing to drop.');
    }

    console.log('Seeding sample users...');
    for (const u of sampleUsers) {
      const check = validatePassword(u.password);
      if (!check.valid) {
        throw new Error(`Sample password for ${u.email} failed policy: ${check.errors.join('; ')}`);
      }
      const userDoc = new User(u);
      await userDoc.save();
      console.log(`Created user: ${u.email} (role ${u.role})`);
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
