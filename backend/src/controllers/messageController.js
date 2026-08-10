import Message from '../models/Message.js';

/**
 * @desc    Get previous chat messages
 * @route   GET /api/messages
 * @access  Public
 */
export const getMessages = async (req, res) => {
  try {
    // Fetch latest 100 messages
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100);

    // Return in chronological order
    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving messages' });
  }
};

/**
 * @desc    Create a new message via REST API
 * @route   POST /api/messages
 * @access  Public
 */
export const createMessage = async (req, res) => {
  try {
    let { username, message } = req.body;

    // Validation
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing username' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing message content' });
    }

    username = username.trim();
    message = message.trim();

    if (username.length === 0) {
      return res.status(400).json({ success: false, message: 'Username cannot be empty' });
    }
    if (username.length > 50) {
      return res.status(400).json({ success: false, message: 'Username is too long (max 50 chars)' });
    }
    if (message.length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long (max 2000 chars)' });
    }

    // Save to database
    const newMessage = new Message({
      username,
      message,
      status: 'sent',
      readBy: []
    });

    const savedMessage = await newMessage.save();

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error in createMessage:', error);
    res.status(500).json({ success: false, message: 'Server error saving message' });
  }
};
