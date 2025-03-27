const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor() {
    this.db = new sqlite3.Database(
      path.join(__dirname, "../data/messages.db"),
      (err) => {
        if (err) {
          console.error("数据库连接失败:", err);
          return;
        }
        console.log("数据库连接成功");
        this.initTables();
      }
    );
  }

  initTables() {
    // 创建消息表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        language TEXT,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        recipient_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    this.db.run("CREATE INDEX IF NOT EXISTS idx_room_id ON messages(room_id)");
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp)"
    );
  }

  // 保存消息
  saveMessage(message) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO messages (
          id, room_id, type, content, language, sender_id, sender_name, recipient_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        message.id,
        message.roomId,
        message.type,
        message.content,
        message.language,
        message.senderId,
        message.sender,
        message.recipientId,
        (err) => {
          if (err) {
            console.error("保存消息失败:", err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // 获取聊天室历史消息
  getRoomMessages(roomId, limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM messages 
         WHERE room_id = ? 
         ORDER BY timestamp ASC 
         LIMIT ?`,
        [roomId, limit],
        (err, rows) => {
          if (err) {
            console.error("获取历史消息失败:", err);
            reject(err);
            return;
          }
          resolve(rows); // 直接返回，不需要 reverse
        }
      );
    });
  }

  // 清理旧消息
  cleanupOldMessages(days = 30) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM messages 
         WHERE timestamp < datetime('now', '-? days')`,
        [days],
        (err) => {
          if (err) {
            console.error("清理旧消息失败:", err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error("关闭数据库连接失败:", err);
          reject(err);
          return;
        }
        console.log("数据库连接已关闭");
        resolve();
      });
    });
  }
}

module.exports = new Database();
