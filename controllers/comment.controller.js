const express = require('express');
const router = express.Router();
const Comment = require('../models/comments');
const isSignedIn = require('../middleware/is-signed-in.js');

router.post('/cars/:listingId/comments', isSignedIn, async (req, res) => {
    const newComment = {
        content: req.body.content,
        author: req.session.user._id,
        listing: req.params.listingId
    }

    await Comment.create(newComment)
    res.redirect(`/cars/${req.params.listingId}`)
});

router.delete('/comments/:commentId', isSignedIn, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId)
        if (!comment) {
            return res.status(404).send('Comment not found')
        }

        // Check if current user is the author
        if (comment.author.toString() !== req.session.user._id) {
            return res.status(403).send('You can only delete your own comments')
        }

        const listingId = comment.listing
        await Comment.findByIdAndDelete(req.params.commentId)
        res.redirect(`/cars/${listingId}`)
    } catch (error) {
        console.error('Error deleting comment:', error)
        res.status(500).send('Error deleting comment')
    }
})

module.exports = router
