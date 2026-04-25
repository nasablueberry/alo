/**
 * One-time script to create an admin user.
 * Usage: node scripts/createAdmin.js [email] [password]
 * Requires: MONGODB_URI in env (or .env in backend folder)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const email = process.argv[2] || 'admin@eads.local';
const password = process.argv[3] || 'admin123';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../src/models/User.model.js')).default;
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin with this email already exists.');
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 12);
  await User.create({ email, password: hashed, role: 'admin', isActive: true });
  console.log('Admin created:', email);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
