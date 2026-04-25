/**
 * Seed database with 1 admin, 10 providers, 100 students.
 * Usage: node scripts/seed.js
 * Requires: MONGODB_URI in env (e.g. from backend/.env)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import StudentProfile from '../src/models/StudentProfile.model.js';
import AidProvider from '../src/models/AidProvider.model.js';
import ScholarshipProgram from '../src/models/ScholarshipProgram.model.js';
import Application from '../src/models/Application.model.js';
import Disbursement from '../src/models/Disbursement.model.js';

const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Tangail', 'Dinajpur', 'Jessore', 'Bogra', 'Kushtia', 'Noakhali',
];
const UPAZILAS_BY_DISTRICT = {
  Dhaka: ['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Savar', 'Keraniganj'],
  Chittagong: ['Patenga', 'Double Mooring', 'Hathazari', 'Raozan', 'Sandwip'],
  Sylhet: ['Zakiganj', 'Beanibazar', 'Golapganj', 'Companiganj', 'Jaintiapur'],
  Rajshahi: ['Boalia', 'Rajpara', 'Motihar', 'Godagari', 'Tanore'],
  Khulna: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Dumuria', 'Batiaghata'],
  Barisal: ['Kotwali', 'Band Road', 'Rupatali', 'Bakerganj', 'Mehendiganj'],
  Rangpur: ['Rangpur Sadar', 'Mithapukur', 'Pirgachha', 'Kaunia', 'Gangachara'],
  Mymensingh: ['Mymensingh Sadar', 'Muktagachha', 'Trishal', 'Gaffargaon', 'Fulbaria'],
  Comilla: ['Comilla Sadar', 'Chandina', 'Laksam', 'Homna', 'Debidwar'],
  Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
  Tangail: ['Tangail Sadar', 'Mirzapur', 'Gopalpur', 'Kalihati', 'Sakhipur'],
  Dinajpur: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Chirirbandar', 'Fulbari'],
  Jessore: ['Jessore Sadar', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Monirampur'],
  Bogra: ['Bogra Sadar', 'Sherpur', 'Dhunat', 'Gabtali', 'Sariakandi'],
  Kushtia: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Mirpur', 'Khoksa'],
  Noakhali: ['Noakhali Sadar', 'Companiganj', 'Begumganj', 'Chatkhil', 'Senbagh'],
};
const INSTITUTIONS = [
  'Govt. High School', 'Model School', 'Residential College', 'City College', 'University of Dhaka',
  'Chittagong University', 'Sylhet MC College', 'Rajshahi College', 'Polytechnic Institute',
  'Bangladesh University', 'Local College', 'Rural High School', 'Women\'s College', 'Technical School',
];
const FIRST_NAMES = [
  'Amina', 'Fatima', 'Hassan', 'Rahim', 'Sakina', 'Karim', 'Zara', 'Imran', 'Laila', 'Omar',
  'Nadia', 'Tariq', 'Yasmin', 'Bilal', 'Chandni', 'Faruk', 'Gulshan', 'Habib', 'Iqbal', 'Jahanara',
  'Kamal', 'Lutfur', 'Mahmud', 'Nazma', 'Rafiq', 'Salma', 'Tahmina', 'Uddin', 'Varsha', 'Wasim',
];
const LAST_NAMES = [
  'Ahmed', 'Hossain', 'Islam', 'Khan', 'Rahman', 'Ali', 'Chowdhury', 'Akter', 'Uddin', 'Haque',
  'Mia', 'Siddique', 'Begum', 'Mollah', 'Sarker', 'Das', 'Roy', 'Sultan', 'Malek', 'Karim',
];

const PROVIDERS = [
  { org: 'BRAC Education Fund', type: 'ngo', email: 'provider1@eads.local' },
  { org: 'Grameen Shikkha', type: 'ngo', email: 'provider2@eads.local' },
  { org: 'Dutch-Bangla Bank Foundation', type: 'bank', email: 'provider3@eads.local' },
  { org: 'Prime Bank Foundation', type: 'bank', email: 'provider4@eads.local' },
  { org: 'Ministry of Education Scholarship', type: 'government', email: 'provider5@eads.local' },
  { org: 'Dhaka University Trust', type: 'private', email: 'provider6@eads.local' },
  { org: 'Save the Children Bangladesh', type: 'ngo', email: 'provider7@eads.local' },
  { org: 'Islami Bank Foundation', type: 'bank', email: 'provider8@eads.local' },
  { org: 'Rural Education Support Program', type: 'ngo', email: 'provider9@eads.local' },
  { org: 'Corporate Education Grant', type: 'private', email: 'provider10@eads.local' },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Application.deleteMany({});
  await Disbursement.deleteMany({});
  await ScholarshipProgram.deleteMany({});
  await StudentProfile.deleteMany({});
  await AidProvider.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared applications, programs, users and profiles');

  const defaultPassword = 'Password123';

  // 1 Admin (password hashed by User model pre-save)
  await User.create({
    email: 'admin@eads.local',
    password: 'Admin123!',
    role: 'admin',
    isActive: true,
  });
  console.log('Created admin: admin@eads.local / Admin123!');

  // 10 Providers (User model hashes on save, so we need to create without pre-save or use raw password and let model hash)
  for (const p of PROVIDERS) {
    const user = await User.create({
      email: p.email,
      password: defaultPassword,
      role: 'provider',
      isActive: true,
    });
    await AidProvider.create({
      user: user._id,
      organizationName: p.org,
      type: p.type,
      contactPerson: 'Contact Person',
      phone: '+8801XXXXXXXXX',
      district: pick(DISTRICTS),
      description: `Scholarship and education support by ${p.org}.`,
      isVerified: true,
    });
  }
  console.log('Created 10 providers (provider1@eads.local ... provider10@eads.local / Password123)');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 2);
  const applicationDeadline = new Date();
  applicationDeadline.setMonth(applicationDeadline.getMonth() + 8);

  const providers = await AidProvider.find();
  for (const ap of providers) {
    const totalFund = randomBetween(400000, 2500000);
    const amountPerBeneficiary = randomBetween(8000, 80000);
    const maxBeneficiaries = Math.max(3, Math.min(40, Math.floor(totalFund / amountPerBeneficiary)));
    await ScholarshipProgram.create({
      provider: ap._id,
      title: `Open Scholarship — ${ap.organizationName}`,
      description:
        'Need-based educational aid for Bangladeshi students. Apply before the deadline; eligibility is reviewed automatically.',
      totalFund,
      remainingFund: totalFund,
      amountPerBeneficiary,
      maxBeneficiaries,
      currentBeneficiaries: 0,
      eligibilityCriteria: {
        minCgpa: 2,
        maxIncome: 60000,
        minAttendance: 55,
      },
      startDate,
      endDate,
      applicationDeadline,
      status: 'active',
      durationMonths: 12,
    });
  }
  console.log(`Created ${providers.length} active scholarship programs (deadline ~8 months ahead)`);

  // 100 Students
  const usedBirthIds = new Set();
  for (let i = 1; i <= 100; i++) {
    const email = `student${i}@eads.local`;
    const user = await User.create({
      email,
      password: defaultPassword,
      role: 'student',
      isActive: true,
    });
    const district = pick(DISTRICTS);
    const upazilas = UPAZILAS_BY_DISTRICT[district] || [district + ' Sadar'];
    const upazila = pick(upazilas);
    let birthId;
    do {
      birthId = `BC-${String(100000 + i).padStart(6, '0')}`;
    } while (usedBirthIds.has(birthId));
    usedBirthIds.add(birthId);

    const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const householdIncome = randomBetween(8000, 45000);
    const familySize = randomBetween(2, 8);
    const attendancePercentage = randomBetween(65, 98);
    const cgpa = Math.round((randomBetween(20, 38) / 10) * 100) / 100;

    await StudentProfile.create({
      user: user._id,
      birthCertificateId: birthId,
      fullName,
      phone: `+8801${randomBetween(500000000, 999999999)}`,
      district,
      upazila,
      institutionName: pick(INSTITUTIONS),
      institutionType: pick(['school', 'college', 'university']),
      householdIncome,
      familySize,
      attendancePercentage,
      cgpa,
      verificationStatus: i <= 80 ? 'verified' : 'pending',
      financialNeedScore: Math.min(100, Math.round((householdIncome / 30000) * 40 + (familySize / 6) * 30 + ((100 - attendancePercentage) / 100) * 30)),
    });
  }
  console.log('Created 100 students (student1@eads.local ... student100@eads.local / Password123)');

  console.log('\nSeed complete.');
  console.log('Admin: admin@eads.local / Admin123!');
  console.log('Providers: provider1@eads.local ... provider10@eads.local / Password123');
  console.log('Students: student1@eads.local ... student100@eads.local / Password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
