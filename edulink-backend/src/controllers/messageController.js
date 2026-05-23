const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../config/socket');

const messageController = {
  /**
   * GET /api/messages
   * Get all conversations for the current user
   */
  getConversations(req, res, next) {
    try {
      const conversations = db.prepare(`
        SELECT c.id, c.last_message, c.last_message_at,
               CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id
        FROM conversations c
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY c.last_message_at DESC NULLS LAST
      `).all(req.user.id, req.user.id, req.user.id);

      // Enrich with user info
      const enriched = conversations.map((conv) => {
        const other = db.prepare(
          'SELECT id, first_name, last_name, avatar_url FROM users WHERE id = ?'
        ).get(conv.other_user_id);

        return {
          id: conv.other_user_id,  // Use other user id as the "message list" id for frontend compat
          chatId: conv.id,
          name: other ? `${other.first_name} ${other.last_name}` : 'Unknown',
          message: conv.last_message || '',
          time: conv.last_message_at ? formatTime(conv.last_message_at) : '',
          avatarPath: other?.avatar_url || '',
        };
      });

      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/messages/:chatId
   * Get messages in a conversation
   */
  getChatMessages(req, res, next) {
    try {
      const { chatId } = req.params;
      const messages = db.prepare(`
        SELECT m.id, m.text, m.sender_id, m.created_at
        FROM messages m
        WHERE m.chat_id = ?
        ORDER BY m.created_at ASC
      `).all(chatId);

      // Mark as read
      db.prepare("UPDATE messages SET is_read = 1 WHERE chat_id = ? AND receiver_id = ? AND is_read = 0")
        .run(chatId, req.user.id);

      const formatted = messages.map((m) => ({
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

  /**
   * POST /api/messages
   * Send a message (creates or appends to a conversation)
   */
  sendMessage(req, res, next) {
    try {
      const { receiverId, text } = req.body;

      if (!receiverId || !text) {
        throw ApiError.badRequest('receiverId and text are required');
      }

      // Validate receiver exists
      const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
      if (!receiver) {
        throw ApiError.notFound('Receiver not found');
      }

      // Find or create conversation
      let conv = db.prepare(`
        SELECT id FROM conversations
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `).get(req.user.id, receiverId, receiverId, req.user.id);

      let chatId;
      if (!conv) {
        chatId = uuidv4();
        db.prepare(`
          INSERT INTO conversations (id, user1_id, user2_id, last_message, last_message_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).run(chatId, req.user.id, receiverId, text);
      } else {
        chatId = conv.id;
        db.prepare(`
          UPDATE conversations SET last_message = ?, last_message_at = datetime('now') WHERE id = ?
        `).run(text, chatId);
      }

      const msgId = uuidv4();
      db.prepare(`
        INSERT INTO messages (id, sender_id, receiver_id, chat_id, text)
        VALUES (?, ?, ?, ?, ?)
      `).run(msgId, req.user.id, receiverId, chatId, text);

      // Auto-create notification for receiver with sender name and ID
      const sender = db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(req.user.id);
      const senderName = `${sender.first_name} ${sender.last_name}`;
      const notifBody = JSON.stringify({ text: text.substring(0, 200), chatId, senderName, senderId: req.user.id });
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body)
        VALUES (?, ?, 'message', ?, ?)
      `).run(uuidv4(), receiverId, `Message from ${senderName}`, notifBody);

      // Real-time: emit to receiver
      emitToUser(receiverId, 'new_message', {
        id: msgId,
        text,
        chatId,
        time: formatTime(new Date().toISOString()),
        senderName: `${sender.first_name} ${sender.last_name}`,
      });

      // Also emit notification event
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
