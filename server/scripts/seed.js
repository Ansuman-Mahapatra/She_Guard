/**
 * Seed script — adds test EmergencySession and User data to MongoDB.
 * Run from project root: npm run seed
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const EmergencySession = require('../models/EmergencySession');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency_db';

const GUARDIAN_EMAIL = '23cse522.ansumanmahapatra@giet.edu';
const POLICE_EMAIL = 'ansumanmahapatre@giet.edu';

const testSessions = [
  {
    victimName: 'Priya Sharma',
    victimDetails: {
      phone: '+919876543210',
      altPhone: '+919876543299',
      email: 'priya.sharma@email.com',
      address: 'Flat 304, Sai Residency, Patia, Bhubaneswar - 751024',
      age: 24,
      bloodGroup: 'O+',
      medical: 'Asthma (carries inhaler)',
      registeredDate: 'Jan 15, 2024',
      previousSOS: 1,
    },
    guardianDetails: {
      name: 'Sunita Sharma',
      relation: 'Mother',
      phone: '+919876543211',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'physical_attack',
    status: 'ACTIVE',
    riskScore: 75,
    riskLevel: 'CRITICAL',
    tamperDetected: false,
    locations: [
      { lat: 20.2961, lng: 85.8245, speed: 0, direction: 0, audioLevel: 45, timestamp: new Date(Date.now() - 180000) },
      { lat: 20.2963, lng: 85.8247, speed: 5, direction: 45, audioLevel: 72, timestamp: new Date(Date.now() - 120000) },
      { lat: 20.2966, lng: 85.825, speed: 8, direction: 45, audioLevel: 65, timestamp: new Date(Date.now() - 60000) },
      { lat: 20.2968, lng: 85.8251, speed: 6, direction: 50, audioLevel: 55, timestamp: new Date() },
    ],
    timelineEvents: [
      { event: 'SOS triggered', timestamp: new Date(Date.now() - 180000) },
      { event: 'Location update received', timestamp: new Date(Date.now() - 120000) },
    ],
    startTime: new Date(Date.now() - 180000),
  },
  {
    victimName: 'Ritu Mishra',
    victimDetails: {
      phone: '+919123456780',
      altPhone: '+919123456781',
      email: 'ritu.m@email.com',
      address: 'House 12, Nayapalli, Bhubaneswar - 751012',
      age: 30,
      bloodGroup: 'A+',
      medical: '',
      registeredDate: 'Mar 20, 2024',
      previousSOS: 0,
    },
    guardianDetails: {
      name: 'Ramesh Mishra',
      relation: 'Father',
      phone: '+919123456781',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'forced_vehicle',
    status: 'ACTIVE',
    riskScore: 55,
    riskLevel: 'HIGH',
    tamperDetected: false,
    locations: [
      { lat: 20.2891, lng: 85.819, speed: 0, direction: 0, audioLevel: 30, timestamp: new Date(Date.now() - 300000) },
      { lat: 20.2895, lng: 85.8192, speed: 35, direction: 30, audioLevel: 40, timestamp: new Date(Date.now() - 240000) },
      { lat: 20.29, lng: 85.8195, speed: 42, direction: 30, audioLevel: 35, timestamp: new Date() },
    ],
    timelineEvents: [
      { event: 'SOS triggered', timestamp: new Date(Date.now() - 300000) },
      { event: 'High speed detected — possible vehicle movement', timestamp: new Date(Date.now() - 240000) },
    ],
    startTime: new Date(Date.now() - 300000),
  },
  {
    victimName: 'Ananya Das',
    victimDetails: {
      phone: '+919988776655',
      altPhone: '+919988776656',
      email: 'ananya.d@email.com',
      address: 'Room 201, Girls Hostel, KIIT University, Bhubaneswar - 751024',
      age: 19,
      bloodGroup: 'B+',
      medical: '',
      registeredDate: 'Dec 05, 2023',
      previousSOS: 0,
    },
    guardianDetails: {
      name: 'Sunil Das',
      relation: 'Father',
      phone: '+919988776656',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'unsafe',
    status: 'ACTIVE',
    riskScore: 45,
    riskLevel: 'HIGH',
    tamperDetected: false,
    locations: [
      { lat: 20.3541, lng: 85.8143, speed: 0, direction: 0, audioLevel: 80, timestamp: new Date() },
    ],
    timelineEvents: [{ event: 'SOS triggered', timestamp: new Date() }],
    startTime: new Date(Date.now() - 60000),
  },
  {
    victimName: 'Kavya Reddy',
    victimDetails: {
      phone: '+919555123456',
      altPhone: '+919555123457',
      email: 'kavya.r@email.com',
      address: 'Block B, Silicon City, Chandrasekharpur - 751016',
      age: 22,
      bloodGroup: 'O-',
      medical: '',
      registeredDate: 'Feb 01, 2024',
      previousSOS: 0,
    },
    guardianDetails: {
      name: 'Venkat Reddy',
      relation: 'Father',
      phone: '+919555123457',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'physical_attack',
    status: 'ACTIVE',
    riskScore: 92,
    riskLevel: 'CRITICAL',
    tamperDetected: true,
    locations: [
      { lat: 20.3121, lng: 85.8012, speed: 2, direction: 90, audioLevel: 88, timestamp: new Date(Date.now() - 90000) },
      { lat: 20.3118, lng: 85.8018, speed: 3, direction: 270, audioLevel: 95, timestamp: new Date(Date.now() - 45000) },
      { lat: 20.3115, lng: 85.8021, speed: 0, direction: 0, audioLevel: 90, timestamp: new Date() },
    ],
    timelineEvents: [
      { event: 'SOS triggered', timestamp: new Date(Date.now() - 90000) },
      { event: 'Tamper detected — possible forced unlock', timestamp: new Date(Date.now() - 60000) },
      { event: 'High audio level — distress detected', timestamp: new Date(Date.now() - 30000) },
    ],
    startTime: new Date(Date.now() - 90000),
  },
  {
    victimName: 'Neha Gupta',
    victimDetails: {
      phone: '+919777654321',
      altPhone: '+919777654322',
      email: 'neha.g@email.com',
      address: 'Apt 502, Fortune Towers, Patia - 751024',
      age: 27,
      bloodGroup: 'A-',
      medical: 'Epilepsy (carries medication)',
      registeredDate: 'Jan 08, 2024',
      previousSOS: 1,
    },
    guardianDetails: {
      name: 'Ravi Gupta',
      relation: 'Brother',
      phone: '+919777654322',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'unsafe',
    status: 'ACTIVE',
    riskScore: 88,
    riskLevel: 'CRITICAL',
    tamperDetected: false,
    locations: [
      { lat: 20.2985, lng: 85.8321, speed: 0, direction: 0, audioLevel: 62, timestamp: new Date(Date.now() - 120000) },
      { lat: 20.2982, lng: 85.8318, speed: 5, direction: 180, audioLevel: 58, timestamp: new Date(Date.now() - 60000) },
      { lat: 20.2979, lng: 85.8315, speed: 8, direction: 200, audioLevel: 55, timestamp: new Date() },
    ],
    timelineEvents: [
      { event: 'SOS triggered', timestamp: new Date(Date.now() - 120000) },
      { event: 'Location update — victim moving', timestamp: new Date(Date.now() - 60000) },
    ],
    startTime: new Date(Date.now() - 120000),
  },
  {
    victimName: 'Divya Menon',
    victimDetails: {
      phone: '+919888111222',
      altPhone: '+919888111223',
      email: 'divya.m@email.com',
      address: 'Plot 78, Sailashree Vihar - 751021',
      age: 21,
      bloodGroup: 'B+',
      medical: '',
      registeredDate: 'Mar 05, 2024',
      previousSOS: 0,
    },
    guardianDetails: {
      name: 'Lakshmi Menon',
      relation: 'Mother',
      phone: '+919888111223',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'forced_vehicle',
    status: 'ACTIVE',
    riskScore: 95,
    riskLevel: 'CRITICAL',
    tamperDetected: false,
    locations: [
      { lat: 20.2876, lng: 85.8156, speed: 0, direction: 0, audioLevel: 40, timestamp: new Date(Date.now() - 150000) },
      { lat: 20.2845, lng: 85.8189, speed: 55, direction: 15, audioLevel: 48, timestamp: new Date(Date.now() - 90000) },
      { lat: 20.2812, lng: 85.8221, speed: 62, direction: 12, audioLevel: 52, timestamp: new Date() },
    ],
    timelineEvents: [
      { event: 'SOS triggered', timestamp: new Date(Date.now() - 150000) },
      { event: 'High speed detected — possible abduction', timestamp: new Date(Date.now() - 120000) },
      { event: 'Vehicle accelerating — critical', timestamp: new Date(Date.now() - 30000) },
    ],
    startTime: new Date(Date.now() - 150000),
  },
  {
    victimName: 'Meera Patnaik',
    victimDetails: {
      phone: '+917654321098',
      altPhone: '+917654321099',
      email: 'meera.p@email.com',
      address: 'Plot 45, Chandrasekharpur, Bhubaneswar - 751016',
      age: 35,
      bloodGroup: 'AB+',
      medical: '',
      registeredDate: 'Nov 10, 2023',
      previousSOS: 2,
    },
    guardianDetails: {
      name: 'Arun Patnaik',
      relation: 'Husband',
      phone: '+917654321099',
      email: GUARDIAN_EMAIL,
    },
    policeEmail: POLICE_EMAIL,
    contextType: 'medical',
    status: 'RESOLVED',
    riskScore: 40,
    riskLevel: 'HIGH',
    tamperDetected: false,
    locations: [
      { lat: 20.325, lng: 85.81, speed: 0, direction: 0, audioLevel: 20, timestamp: new Date(Date.now() - 3600000) },
    ],
    timelineEvents: [
      { event: 'SOS triggered', timestamp: new Date(Date.now() - 3600000) },
      { event: 'Session resolved by victim', timestamp: new Date(Date.now() - 3500000) },
    ],
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() - 3500000),
  },
];

const testUsers = [
  { name: 'Priya Sharma', phone: '+919876543210', email: 'priya.sharma@email.com', role: 'victim' },
  { name: 'Sunita Sharma', phone: '+919876543211', email: GUARDIAN_EMAIL, role: 'guardian' },
  { name: 'Officer Verma', phone: '+919876543212', email: POLICE_EMAIL, role: 'pcr' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    await EmergencySession.deleteMany({});
    console.log('Cleared existing EmergencySessions');

    const sessions = await EmergencySession.insertMany(testSessions);
    console.log('Inserted', sessions.length, 'EmergencySessions');

    for (const u of testUsers) {
      await User.updateOne({ phone: u.phone }, { $set: u }, { upsert: true });
    }
    console.log('Upserted', testUsers.length, 'Users');

    console.log('Seed complete. Guardian:', GUARDIAN_EMAIL, '| Police:', POLICE_EMAIL);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
