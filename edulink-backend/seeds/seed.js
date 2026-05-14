const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const FORCE = process.argv.includes('--force');

// Check if database already has users
const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

if (userCount > 0 && !FORCE) {
  console.log(`Database already has ${userCount} users. Use --force to wipe and re-seed.`);
  console.log('Skipping seed to avoid destroying real data.');
  process.exit(0);
}

if (FORCE) {
  console.log('--force flag detected. Wiping all data...');
}

console.log('Seeding database...');

// Clear existing data only if --force
if (FORCE) {
  const tables = [
    'notifications', 'reviews', 'payments', 'lessons', 'messages',
    'conversations', 'teacher_classes', 'appointments', 'user_subscriptions',
    'subscriptions', 'tutor_availability', 'tutors', 'users',
  ];
  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
}

const SALT = bcrypt.hashSync('password123!', 10);
const now = new Date().toISOString();

// ---- Users ----
const student1Id = uuidv4();
const teacher1Id = uuidv4();
const teacher2Id = uuidv4();
const teacher3Id = uuidv4();

const users = [
  { id: student1Id, first_name: 'Karim', last_name: 'Mohammed', email: 'karimshebo15@gmail.com', password_hash: SALT, role: 'student', interests: JSON.stringify(['Arabic', 'English', 'Vocabulary']) },
  { id: teacher1Id, first_name: 'Karim', last_name: 'Mohammed', email: 'teacher1@edulink.com', password_hash: SALT, role: 'teacher', country: 'au', interests: JSON.stringify(['Arabic', 'English', 'Mathematics']) },
  { id: teacher2Id, first_name: 'Karim', last_name: 'Mohammed', email: 'teacher2@edulink.com', password_hash: SALT, role: 'teacher', country: 'uk', interests: JSON.stringify(['English', 'Science', 'Programming']) },
  { id: teacher3Id, first_name: 'Karim', last_name: 'Mohammed', email: 'teacher3@edulink.com', password_hash: SALT, role: 'teacher', country: 'us', interests: JSON.stringify(['Business', 'English']) },
];

const insertUser = db.prepare(`
  INSERT INTO users (id, first_name, last_name, email, password_hash, role, country, interests, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const u of users) {
  insertUser.run(u.id, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.country, u.interests, now, now);
}

// ---- Tutors ----
const tutor1Id = uuidv4();
const tutor2Id = uuidv4();
const tutor3Id = uuidv4();
const tutor4Id = uuidv4();
const tutor5Id = uuidv4();

const tutors = [
  { id: tutor1Id, user_id: teacher1Id, name: 'Karim Mohammed', rating: 4.5, accent: 'Australian Accent', country: 'au', description: 'Experienced tutor specializing in Arabic, English, and Mathematics. With over 5 years of teaching experience, I focus on making complex concepts easy to understand through practical examples and interactive learning methods.', video_url: 'https://youtu.be/ZK-rNEhJIDs?si=VFbJ-7zyTCpObx9s', is_available: 1, interests: JSON.stringify(['Arabic', 'English', 'Mathematics']) },
  { id: tutor2Id, user_id: teacher2Id, name: 'Karim Mohammed', rating: 4.5, accent: 'British Accent', country: 'uk', description: 'Passionate about teaching Science and Programming. I combine my technical expertise with clear communication to help students master both theoretical concepts and practical skills. Specialized in Python and web development.', video_url: 'https://youtu.be/ZK-rNEhJIDs?si=VFbJ-7zyTCpObx9s', is_available: 1, interests: JSON.stringify(['English', 'Science', 'Programming']) },
  { id: tutor3Id, user_id: teacher3Id, name: 'Karim Mohammed', rating: 4.5, accent: 'American Accent', country: 'us', description: 'Business and English language expert with a focus on professional communication.', video_url: 'https://youtu.be/ZK-rNEhJIDs?si=VFbJ-7zyTCpObx9s', is_available: 0, interests: JSON.stringify(['Business', 'English']) },
];

const insertTutor = db.prepare(`
  INSERT INTO tutors (id, user_id, name, rating, accent, country, description, video_url, is_available, interests, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const t of tutors) {
  insertTutor.run(t.id, t.user_id, t.name, t.rating, t.accent, t.country, t.description, t.video_url, t.is_available, t.interests, now, now);
}

// ---- Tutor Availability ----
const avails = [
  { id: uuidv4(), tutor_id: tutor1Id, day_of_week: 'MON', start_time: '08:00', end_time: '12:00' },
  { id: uuidv4(), tutor_id: tutor1Id, day_of_week: 'WED', start_time: '14:00', end_time: '18:00' },
  { id: uuidv4(), tutor_id: tutor2Id, day_of_week: 'TUE', start_time: '09:00', end_time: '13:00' },
  { id: uuidv4(), tutor_id: tutor2Id, day_of_week: 'THU', start_time: '10:00', end_time: '14:00' },
];
const insertAvail = db.prepare(`
  INSERT INTO tutor_availability (id, tutor_id, day_of_week, start_time, end_time, is_recurring)
  VALUES (?, ?, ?, ?, ?, 1)
`);
for (const a of avails) {
  insertAvail.run(a.id, a.tutor_id, a.day_of_week, a.start_time, a.end_time);
}

// ---- Subscriptions ----
const sub1Id = uuidv4();
const sub2Id = uuidv4();
db.prepare(`INSERT INTO subscriptions (id, title, price, lessons, duration) VALUES (?, 'Stander', 60, 12, '28 hrs 40 mins')`).run(sub1Id);
db.prepare(`INSERT INTO subscriptions (id, title, price, lessons, duration) VALUES (?, 'Premium', 120, 24, '56 hrs 20 mins')`).run(sub2Id);

// ---- Appointments ----
const appt1Id = uuidv4();
const appt2Id = uuidv4();
const appt3Id = uuidv4();
const insertAppt = db.prepare(`
  INSERT INTO appointments (id, student_id, tutor_id, date, day, start_time, end_time, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming')
`);
insertAppt.run(appt1Id, student1Id, tutor1Id, '2024-06-11', 'MON', '08:00', '12:00');
insertAppt.run(appt2Id, student1Id, tutor2Id, '2024-06-11', 'MON', '08:00', '12:00');
insertAppt.run(appt3Id, student1Id, tutor2Id, '2024-06-11', 'MON', '08:00', '12:00');

// ---- Teacher Classes ----
const class1Id = uuidv4();
const class2Id = uuidv4();
const class3Id = uuidv4();
const insertClass = db.prepare(`
  INSERT INTO teacher_classes (id, teacher_id, student_id, student_name, appointment_id, date, time, duration, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertClass.run(class1Id, teacher1Id, student1Id, 'Karim Mohammed', appt1Id, 'Mon, 11 June 2024', '08:00 - 12:00', '4 hours', 'upcoming');
insertClass.run(class2Id, teacher2Id, student1Id, 'Karim Mohammed', appt2Id, 'Mon, 11 June 2024', '08:00 - 12:00', '--', 'completed');
insertClass.run(class3Id, teacher2Id, student1Id, 'Karim Mohammed', appt3Id, 'Mon, 11 June 2024', '08:00 - 12:00', '--', 'cancelled');

// ---- Messages + Conversations ----
const conv1Id = uuidv4();
const conv2Id = uuidv4();
const conv3Id = uuidv4();
const insertConv = db.prepare(`
  INSERT INTO conversations (id, user1_id, user2_id, last_message, last_message_at)
  VALUES (?, ?, ?, ?, ?)
`);
insertConv.run(conv1Id, student1Id, teacher1Id, 'Perfect, will check it', now);
insertConv.run(conv2Id, student1Id, teacher2Id, 'Perfect, will check it', now);
insertConv.run(conv3Id, student1Id, teacher3Id, 'Perfect, will check it', now);

const insertMsg = db.prepare(`
  INSERT INTO messages (id, sender_id, receiver_id, chat_id, text, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertMsg.run(uuidv4(), teacher1Id, student1Id, conv1Id, 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.', '2024-06-11T20:04:00Z');
insertMsg.run(uuidv4(), student1Id, teacher1Id, conv1Id, 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.', '2024-06-11T20:05:00Z');
insertMsg.run(uuidv4(), teacher2Id, student1Id, conv2Id, 'Perfect, will check it', '2024-06-11T21:34:00Z');
insertMsg.run(uuidv4(), teacher3Id, student1Id, conv3Id, 'Perfect, will check it', '2024-06-11T21:34:00Z');

// ---- Lessons ----
const insertLesson = db.prepare(`
  INSERT INTO lessons (id, user_id, title, duration, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertLesson.run(uuidv4(), student1Id, 'Introduction', '6:10 mins', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', '2025-02-04T20:30:00Z');
insertLesson.run(uuidv4(), student1Id, 'grammer', '6:10 mins', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', '2025-02-04T19:45:00Z');
insertLesson.run(uuidv4(), student1Id, 'base language', '6:10 mins', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', '2025-02-04T18:20:00Z');

// ---- Payments ----
const payments = [
  { type: 'Session', amount: 28.10, card_type: 'MASTERCARD', card_last_four: '3241', date: '12/12/21' },
  { type: 'Session', amount: 28.10, card_type: 'MASTERCARD', card_last_four: '3241', date: '11/28/21' },
  { type: 'Session', amount: 28.10, card_type: 'VISA', card_last_four: '4523', date: '11/15/21' },
  { type: 'Session', amount: 28.10, card_type: 'MASTERCARD', card_last_four: '3241', date: '11/02/21' },
  { type: 'Session', amount: 32.50, card_type: 'VISA', card_last_four: '4523', date: '10/28/21' },
  { type: 'Session', amount: 28.10, card_type: 'MASTERCARD', card_last_four: '3241', date: '10/15/21' },
  { type: 'Session', amount: 45.00, card_type: 'PAYPAL', card_last_four: '8976', date: '10/05/21' },
  { type: 'Session', amount: 28.10, card_type: 'MASTERCARD', card_last_four: '3241', date: '09/22/21' },
  { type: 'Bonus', amount: 50.00, card_type: 'DIRECT', card_last_four: '9012', date: '09/10/21' },
  { type: 'Session', amount: 32.50, card_type: 'VISA', card_last_four: '4523', date: '08/28/21' },
  { type: 'Session', amount: 28.10, card_type: 'MASTERCARD', card_last_four: '3241', date: '08/15/21' },
  { type: 'Session', amount: 45.00, card_type: 'PAYPAL', card_last_four: '8976', date: '08/01/21' },
];
const insertPayment = db.prepare(`
  INSERT INTO payments (id, user_id, type, amount, card_type, card_last_four, date, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
`);
for (const p of payments) {
  insertPayment.run(uuidv4(), teacher1Id, p.type, p.amount, p.card_type, p.card_last_four, p.date);
}

// ---- Reviews ----
const reviews = [
  { id: uuidv4(), teacher_id: teacher1Id, student_id: student1Id, student_name: 'Karim Mohamed', rating: 4.5, date: 'Mon, 11 June 2024', time: '08:00 - 12:00' },
  { id: uuidv4(), teacher_id: teacher1Id, student_id: student1Id, student_name: 'Ahmed Ali', rating: 4.5, date: 'Mon, 11 June 2024', time: '08:00 - 12:00' },
  { id: uuidv4(), teacher_id: teacher1Id, student_id: student1Id, student_name: 'Eslam Mohamed', rating: 4.5, date: 'Mon, 11 June 2024', time: '08:00 - 12:00' },
];
const insertReview = db.prepare(`
  INSERT INTO reviews (id, teacher_id, student_id, student_name, rating, date, time)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
for (const r of reviews) {
  insertReview.run(r.id, r.teacher_id, r.student_id, r.student_name, r.rating, r.date, r.time);
}

// ---- Notifications ----
const notifs = [
  { type: 'purchase', title: 'Successful purchase!' },
  { type: 'completion', title: 'Congratulations on completing the ...' },
  { type: 'completion', title: 'Congratulations on completing the ...' },
  { type: 'completion', title: 'Congratulations on completing the ...' },
  { type: 'completion', title: 'Congratulations on completing the ...' },
  { type: 'reminder', title: 'coming session reminder' },
  { type: 'completion', title: 'Congratulations on completing the ...' },
  { type: 'completion', title: 'Congratulations on completing the ...' },
];
const insertNotif = db.prepare(`
  INSERT INTO notifications (id, user_id, type, title, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const timeOffsets = ['now', '-5 hours', '-1 hour', '-1 hour', '-9 hours', '-1 hour', '-2 days', '-1 hour'];
for (let i = 0; i < notifs.length; i++) {
  const n = notifs[i];
  const offset = timeOffsets[i];
  let created;
  if (offset === 'now') created = new Date().toISOString();
  else if (offset.startsWith('-')) {
    const [val, unit] = offset.slice(1).split(' ');
    const ms = unit === 'hours' ? val * 3600000 : unit === 'days' ? val * 86400000 : 0;
    created = new Date(Date.now() - ms).toISOString();
  } else created = new Date().toISOString();
  insertNotif.run(uuidv4(), student1Id, n.type, n.title, created);
}

console.log('Database seeded successfully!');
console.log(`  Student login: karimshebo15@gmail.com / password123!`);
console.log(`  Teacher login: teacher1@edulink.com / password123!`);
console.log(`  (password for all seeded users: password123!)`);
