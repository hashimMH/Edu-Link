const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../config/socket');

const messageController = {
  /** GET /api/messages */
  async getConversations(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT c.id, c.last_message, c.last_message_at,
                CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_user_id
         FROM conversations c
         WHERE c.user1_id = $2 OR c.user2_id = $3
         ORDER BY c.last_message_at DESC NULLS LAST`,
        [req.user.id, req.user.id, req.user.id]
      );

      // Enrich with user info
      const enriched = await Promise.all(r.rows.map(async (conv) => {
        const otherR = await pool.query(
          'SELECT id, first_name, last_name, avatar_url FROM users WHERE id = $1',
          [conv.other_user_id]
        );
        const other = otherR.rows[0];

        return {
          id: conv.other_user_id,
          chatId: conv.id,
          name: other ? `${other.first_name} ${other.last_name}` : 'Unknown',
          message: conv.last_message || '',
          time: conv.last_message_at ? formatTime(conv.last_message_at) : '',
          avatarPath: other?.avatar_url || '',
        };
      }));

      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/messages/:chatId */
  async getChatMessages(req, res, next) {
    try {
      const { chatId } = req.params;
      const r = await pool.query(
        `SELECT m.id, m.text, m.sender_id, m.created_at
         FROM messages m
         WHERE m.chat_id = $1
         ORDER BY m.created_at ASC`,
        [chatId]
      );

      // Mark as read
      await pool.query(
        'UPDATE messages SET is_read = 1 WHERE chat_id = $1 AND receiver_id = $2 AND is_read = 0',
        [chatId, req.user.id]
      );

      const formatted = r.rows.map((m) => ({
        id: m.id,
        text: m.text,
        time: formatTime(m.created_at),
        sender: m.sender_id === req.user.id ? 'You' : 'other',
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/messages */
  async sendMessage(req, res, next) {
    try {
      const { receiverId, text } = req.body;

      if (!receiverId || !text) throw ApiError.badRequest('receiverId and text are required');

      const receiverR = await pool.query('SELECT id FROM users WHERE id = $1', [receiverId]);
      if (!receiverR.rows[0]) throw ApiError.notFound('Receiver not found');

      // Find or create conversation
      const convR = await pool.query(
        `SELECT id FROM conversations
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)`,
        [req.user.id, receiverId, receiverId, req.user.id]
      );
      let conv = convR.rows[0];

      let chatId;
      if (!conv) {
        chatId = uuidv4();
        await pool.query(
          `INSERT INTO conversations (id, user1_id, user2_id, last_message, last_message_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [chatId, req.user.id, receiverId, text]
        );
      } else {
        chatId = conv.id;
        await pool.query(
          'UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2',
          [text, chatId]
        );
      }

      const msgId = uuidv4();
      await pool.query(
        `INSERT INTO messages (id, sender_id, receiver_id, chat_id, text)
         VALUES ($1, $2, $3, $4, $5)`,
        [msgId, req.user.id, receiverId, chatId, text]
      );

      // Auto-create notification
      const senderR = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
      const sender = senderR.rows[0];
      const senderName = `${sender.first_name} ${sender.last_name}`;
      const notifBody = JSON.stringify({ text: text.substring(0, 200), chatId, senderName, senderId: req.user.id });
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body)
         VALUES ($1, $2, 'message', $3, $4)`,
        [uuidv4(), receiverId, `Message from ${senderName}`, notifBody]
      );

      // Real-time
      emitToUser(receiverId, 'new_message', {
        id: msgId,
        text,
        chatId,
        time: formatTime(new Date().toISOString()),
        senderName,
      });

      emitToUser(receiverId, 'new_notification', {
        id: uuidv4(),
        type: 'message',
        title: `Message from ${senderName}`,
        body: text.substring(0, 100),
        time: 'Just now',
        chatId,
        senderName,
      });

      res.status(201).json({
        success: true,
        data: {
          id: msgId,
          text,
          chatId,
          time: formatTime(new Date().toISOString()),
          sender: 'You',
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

module.exports = messageController;
