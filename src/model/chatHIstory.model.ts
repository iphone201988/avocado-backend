// // models/speakingChat.model.ts
// import mongoose from 'mongoose';

// const messageSchema = new mongoose.Schema({
//   role: { type: String, enum: ['user', 'assistant'], required: true },
//   content: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
// });

// const speakingChatSchema = new mongoose.Schema({
//   moduleId: { type: mongoose.Types.ObjectId, ref: 'Module', required: true },
//   userId: { type: mongoose.Types.ObjectId, ref: 'User' },
//   messages: [messageSchema],
// });

// export const SpeakingChatModel = mongoose.model('SpeakingChat', speakingChatSchema);