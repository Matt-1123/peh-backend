import express from 'express';
import { connectDB } from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

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
// @description   Update a user's username
// @access        Private
router.put('/:id', protect, (req, res) => {
  const userId = req.params.id;
  const { username } = req.body;
  
  // Validate username is provided
  if (!username || username.trim() === '') {
    return res.status(400).json({ Error: "Username is required" });
  }
  
  // Check if user exists and is authorized
  const userCheck = "SELECT * FROM users WHERE id = ?";
  db.query(userCheck, [userId], (err, userData) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    
    // Check if user exists
    if (userData.length === 0) {
      return res.status(404).json({ Error: "User ID not found" });
    }
    
    // Check if user is authorized to update
    if (userData[0].id !== req.user.id) {
      return res.status(403).json({ Error: "Not authorized to update this user." });
    }

    const oldUsername = userData[0].username;
    
    // Check if username already exists (excluding current user)
    const usernameCheck = "SELECT id FROM users WHERE username = ? AND id != ?";
    db.query(usernameCheck, [username, userId], (err, existingUser) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      
      if (existingUser.length > 0) {
        return res.status(409).json({ Error: "Username already exists" });
      }
      
      // Update username
      const updateQuery = "UPDATE users SET username = ? WHERE id = ?";
      db.query(updateQuery, [username, userId], (err, updateResult) => {
        console.log('updateResult: ', updateResult)
        
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }
        
        res.status(200).json({ 
          message: "Username updated successfully",
          oldUsername: oldUsername,
          newUsername: username
        });
      });
    });
  });
})

export default router;