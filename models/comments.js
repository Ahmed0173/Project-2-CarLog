const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    content: {
        type: String,        // The actual comment text
        required: true,      // Comments must have content
        trim: true          // Remove extra whitespace
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,  // Reference to User who wrote it
        ref: 'User',        // Links to User collection
        required: true      // Every comment must have an author
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,  // Reference to Listing being commented on
        ref: 'Listing',     // Links to Listing collection
        required: true      // Every comment belongs to a listing
    }
}, { timestamps: true })


const Comment = mongoose.model("Comment", commentSchema)
module.exports = Comment