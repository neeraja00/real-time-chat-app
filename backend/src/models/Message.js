import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxLength: [50, 'Username cannot exceed 50 characters']
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxLength: [2000, 'Message content cannot exceed 2000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    readBy: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: false // We use our own custom 'timestamp' field to meet requirements
  }
);

// Add index on username for quick history lookup if needed
MessageSchema.index({ username: 1 });

const Message = mongoose.model('Message', MessageSchema);
export default Message;
