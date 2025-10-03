import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';

// @route         GET /user/:id
// @description   Get a user's information
// @access        Private
router.get('/user/:id', protect, (req, res) => {
  res.json('GET request for a user.')
})

// @route         DELETE /user/:id
// @description   Delete a user
// @access        Private
router.delete('/user/:id', protect, (req, res) => {
  res.json('DELETE request for a user.')
})

// @route         PUT /user/:id
// @description   Delete a user
// @access        Private
router.delete('/user/:id', protect, (req, res) => {
  res.json('DELETE request for a user.')
})

export default router;