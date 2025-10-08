const path = require('path');
const bcrypt = require('bcryptjs');

// For deployment, we'll use a simple in-memory database to avoid sqlite3 issues
let useInMemoryDB = process.env.NODE_ENV === 'production';

let db;
let inMemoryData = {
  users: [],
  image_records: [],
  nextUserId: 1,
  nextImageId: 1
};

if (!useInMemoryDB) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(path.join(__dirname, '../../data/alwaycare.db'));
  } catch (error) {
    console.log('SQLite3 not available, using in-memory database');
    useInMemoryDB = true;
  }
}

// Database file path
const dbPath = path.join(__dirname, '../../data/alwaycare.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Initialize database tables
async function initDatabase() {
  if (useInMemoryDB) {
    // Initialize in-memory database
    console.log('🗄️ Using in-memory database for production');
    
    // Create default admin user
    const defaultPassword = 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    inMemoryData.users.push({
      id: inMemoryData.nextUserId++,
      username: 'admin',
      email: 'admin@alwaycare.com',
      password_hash: hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✅ Default admin user created (username: admin, password: admin123)');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ImageRecords table
      db.run(`
        CREATE TABLE IF NOT EXISTS image_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER,
          analysis_status TEXT DEFAULT 'pending',
          detected_objects TEXT,
          risk_level TEXT,
          risk_description TEXT,
          confidence_scores TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_image_records_user_id ON image_records(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_image_records_status ON image_records(analysis_status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_image_records_timestamp ON image_records(upload_timestamp)`);

      // Create default admin user if it doesn't exist
      db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          const defaultPassword = 'admin123';
          bcrypt.hash(defaultPassword, 10, (err, hash) => {
            if (err) {
              reject(err);
              return;
            }
            
            db.run(`
              INSERT INTO users (username, email, password_hash)
              VALUES (?, ?, ?)
            `, ['admin', 'admin@alwaycare.com', hash], (err) => {
              if (err) {
                reject(err);
              } else {
                console.log('✅ Default admin user created (username: admin, password: admin123)');
                resolve();
              }
            });
          });
        } else {
          resolve();
        }
      });
    });
  });
}

// Database utility functions
function runQuery(sql, params = []) {
  if (useInMemoryDB) {
    // Simple in-memory implementation
    return Promise.resolve({ id: Date.now(), changes: 1 });
  }
  
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  if (useInMemoryDB) {
    // Simple in-memory implementation
    if (sql.includes('username = ?') && params[0] === 'admin') {
      return Promise.resolve(inMemoryData.users.find(u => u.username === 'admin'));
    }
    return Promise.resolve(null);
  }
  
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  if (useInMemoryDB) {
    // Simple in-memory implementation
    return Promise.resolve([]);
  }
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery,
  closeDatabase
};
