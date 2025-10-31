import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/db.js';

const db = await connectDB();

// @route         GET /user/:id
// @description   Get a user's username
// @access        Public
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  const q = "SELECT username FROM users WHERE id = ?";

  db.query(q, [userId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else if(data.length === 0) {
      res.status(404).json({ Error: "User ID not found" })
    } else {
      res.status(200).json(data);
    }
  });
})

// @route         DELETE /user/:id
// @description   Delete a user
// @access        Private
router.delete('/:id', protect, (req, res) => {
  const userId = req.params.id;

  const q = "SELECT * FROM users where id = ?"

  db.query(q, [userId], (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    }
    
    // Check if user exists
    if(data.length === 0) {
      return res.status(404).json({ Error: "User ID not found" })
    }

    // Check if user matches
    if(data[0].id !== req.user.id) {
      return res.status(403).json({ Error: "Not authorized to delete this user." })
    }

    const delete_q = "DELETE FROM users WHERE id = ?"

    db.query(delete_q, [userId], (err, deleteData) => {
      if(err) return res.send(err);
      res.json(deleteData)
    })
  })
})

// @route         PUT /user/:id
// @description   Delete a user
// @access        Private
router.put('/:id', protect, (req, res) => {
  res.json('PUT request for user')
})

export default router;