import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/db.js';

const db = await connectDB();

// @route         GET /user/:id
// @description   Get a user's information
// @access        Private
router.get('/:id', protect, (req, res) => {
  const userId = req.params.id;

  const q = "SELECT * FROM users WHERE id = ?";

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
  res.json('DELETE request for a user.')
})

// @route         PUT /user/:id
// @description   Delete a user
// @access        Private
router.delete('/:id', protect, (req, res) => {
  res.json('DELETE request for a user.')
})

export default router;