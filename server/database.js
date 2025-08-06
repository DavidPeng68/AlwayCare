const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  init() {
    const dbPath = path.join(__dirname, 'alwayscare.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
      } else {
        console.log('✅ Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createImageRecordsTable = `
      CREATE TABLE IF NOT EXISTS image_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        detected_objects TEXT,
        confidence_scores TEXT,
        risk_level TEXT DEFAULT 'low',
        status TEXT DEFAULT 'pending',
        analysis_result TEXT,
        error_message TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    this.db.serialize(() => {
      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err.message);
        } else {
          console.log('✅ Users table created or already exists');
        }
      });

      this.db.run(createImageRecordsTable, (err) => {
        if (err) {
          console.error('❌ Error creating image_records table:', err.message);
        } else {
          console.log('✅ Image records table created or already exists');
        }
      });
    });
  }

  // User management methods
  async createUser(username, email, password) {
    return new Promise((resolve, reject) => {
      const saltRounds = 12;
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          reject(err);
          return;
        }

        const sql = `
          INSERT INTO users (username, email, password_hash)
          VALUES (?, ?, ?)
        `;
        
        this.db.run(sql, [username, email, hash], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, email });
          }
        });
      });
    });
  }

  async findUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async findUserById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Image records methods
  async createImageRecord(userId, filename, filepath, originalFilename) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO image_records (user_id, filename, filepath, original_filename)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(sql, [userId, filename, filepath, originalFilename], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, filename, filepath });
        }
      });
    });
  }

  async getPendingImages() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT ir.*, u.username 
        FROM image_records ir 
        JOIN users u ON ir.user_id = u.id 
        WHERE ir.status = 'pending'
        ORDER BY ir.upload_timestamp ASC
      `;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateImageAnalysis(imageId, analysisResult) {
    return new Promise((resolve, reject) => {
      const {
        detectedObjects = [],
        confidenceScores = [],
        riskLevel = 'low',
        status = 'completed',
        error = null
      } = analysisResult;

      const sql = `
        UPDATE image_records 
        SET detected_objects = ?, 
            confidence_scores = ?, 
            risk_level = ?, 
            status = ?, 
            analysis_result = ?,
            error_message = ?
        WHERE id = ?
      `;

      const detectedObjectsStr = JSON.stringify(detectedObjects);
      const confidenceScoresStr = JSON.stringify(confidenceScores);
      const analysisResultStr = JSON.stringify(analysisResult);

      this.db.run(sql, [
        detectedObjectsStr,
        confidenceScoresStr,
        riskLevel,
        status,
        analysisResultStr,
        error,
        imageId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: imageId, changes: this.changes });
        }
      });
    });
  }

  async getImageRecordsByUserId(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM image_records 
        WHERE user_id = ? 
        ORDER BY upload_timestamp DESC
      `;
      
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getImageRecordById(imageId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT ir.*, u.username 
        FROM image_records ir 
        JOIN users u ON ir.user_id = u.id 
        WHERE ir.id = ?
      `;
      
      this.db.get(sql, [imageId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

module.exports = new Database();