const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'academy.db');
let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDatabase() {
  const db = await getDb();

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL,
    description TEXT, price REAL NOT NULL, image TEXT, category TEXT,
    pages INTEGER, language TEXT DEFAULT 'বাংলা', in_stock INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, instructor TEXT NOT NULL,
    description TEXT, price REAL NOT NULL, image TEXT, category TEXT,
    duration TEXT, lessons INTEGER, level TEXT DEFAULT 'শিক্ষানবিস',
    enrolled INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL, item_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    total REAL NOT NULL, status TEXT DEFAULT 'pending',
    name TEXT, email TEXT, phone TEXT, address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
    item_type TEXT NOT NULL, item_id INTEGER NOT NULL,
    item_title TEXT NOT NULL, price REAL NOT NULL, quantity INTEGER DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);

  const result = db.exec('SELECT COUNT(*) as count FROM books');
  const bookCount = result.length > 0 ? result[0].values[0][0] : 0;
  if (bookCount === 0) seedData(db);

  saveDb();
  console.log('  📦 Database initialized successfully');
}

function seedData(db) {
  const books = [
    ['ঈমানের মূলনীতি', 'শাইখ আব্দুল আযীয', 'ইসলামী বিশ্বাসের মৌলিক নীতিমালা সম্পর্কে বিস্তারিত আলোচনা। ঈমানের ছয়টি স্তম্ভ ও তাওহীদের ব্যাখ্যা।', 350, '/images/book-1.jpg', 'আক্বীদাহ', 280, 'বাংলা'],
    ['সহীহ হাদীস সংকলন', 'ইমাম বুখারী (অনুবাদ)', 'সহীহ বুখারী থেকে নির্বাচিত হাদীসের বাংলা অনুবাদ ও ব্যাখ্যা।', 500, '/images/book-2.jpg', 'হাদীস', 450, 'বাংলা'],
    ['ফিক্বহুস সুন্নাহ', 'সাইয়্যিদ সাবিক', 'ইসলামী আইনশাস্ত্রের সহজবোধ্য ব্যাখ্যা। নামায, রোযা, হজ্ব, যাকাত সম্পর্কে বিস্তারিত।', 420, '/images/book-3.jpg', 'ফিক্বহ', 520, 'বাংলা'],
    ['আরবী ভাষা শিক্ষা', 'ড. আব্দুর রহীম', 'মাদীনা ইউনিভার্সিটির পাঠ্যক্রম অনুসারে আরবী ভাষা শেখার সম্পূর্ণ গাইড।', 300, '/images/book-4.jpg', 'ভাষা', 320, 'বাংলা-আরবী'],
    ['সীরাতুন নবী (সা.)', 'সফিউর রহমান মুবারকপুরী', 'রাসূলুল্লাহ (সা.) এর জীবনী। মক্কী ও মাদানী জীবনের বিস্তারিত বিবরণ।', 600, '/images/book-5.jpg', 'সীরাত', 680, 'বাংলা'],
    ['তাফসীরুল কুরআন', 'ইবন কাসীর (অনুবাদ)', 'পবিত্র কুরআনের বিশ্বস্ত তাফসীর। আয়াতের পটভূমি, ব্যাখ্যা ও শিক্ষা।', 750, '/images/book-6.jpg', 'তাফসীর', 820, 'বাংলা']
  ];
  for (const b of books) db.run('INSERT INTO books (title,author,description,price,image,category,pages,language) VALUES (?,?,?,?,?,?,?,?)', b);

  const courses = [
    ['কুরআন তিলাওয়াত কোর্স', 'ক্বারী আহমদ সাঈদ', 'সঠিক তাজওীদ সহ কুরআন তিলাওয়াত শিখুন।', 1500, '/images/course-1.jpg', 'কুরআন', '৩ মাস', 36, 'শিক্ষানবিস', 245],
    ['ইসলামী আক্বীদাহ কোর্স', 'শাইখ মুহাম্মদ ইবরাহীম', 'তাওহীদ, রিসালাত ও আখিরাত সম্পর্কে গভীর জ্ঞান অর্জন করুন।', 1200, '/images/course-2.jpg', 'আক্বীদাহ', '২ মাস', 24, 'মধ্যম', 189],
    ['আরবী ভাষা কোর্স (স্তর ১)', 'উস্তায রাশেদ আল-ফারুক', 'শূন্য থেকে আরবী ভাষা শিখুন।', 2000, '/images/course-3.jpg', 'ভাষা', '৪ মাস', 48, 'শিক্ষানবিস', 320],
    ['ফিক্বহুল ইবাদাত', 'মুফতী তারিক মাসউদ', 'ইবাদতের ফিক্বহ — নামায, রোযা, যাকাত ও হজ্বের বিস্তারিত মাসআলা।', 1800, '/images/course-4.jpg', 'ফিক্বহ', '৩ মাস', 40, 'মধ্যম', 156],
    ['হাদীস অধ্যয়ন কোর্স', 'ড. আবু বকর জাকারিয়া', 'হাদীস শাস্ত্রের মূলনীতি ও পরিভাষা।', 1600, '/images/course-5.jpg', 'হাদীস', '২.৫ মাস', 30, 'উন্নত', 98],
    ['ইসলামী ইতিহাস কোর্স', 'প্রফেসর আব্দুল্লাহ আল-মামুন', 'খিলাফতে রাশেদা থেকে আধুনিক যুগ পর্যন্ত ইতিহাস।', 1000, '/images/course-6.jpg', 'ইতিহাস', '২ মাস', 20, 'শিক্ষানবিস', 275]
  ];
  for (const c of courses) db.run('INSERT INTO courses (title,instructor,description,price,image,category,duration,lessons,level,enrolled) VALUES (?,?,?,?,?,?,?,?,?,?)', c);

  console.log('  🌱 Seeded 6 books and 6 courses');
}

module.exports = { getDb, initDatabase, saveDb };
