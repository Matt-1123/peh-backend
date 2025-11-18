import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/db.js';

const db = await connectDB();

// @route           GET /api/cleanups
// @description     Get all cleanups
// @access          Public
// @query           _limit (optional limit for # of cleanups returned)
router.get("/", (req, res) => {
  const limit = parseInt(req.query._limit);
  
  const q = limit ? `SELECT * FROM cleanups ORDER BY date DESC LIMIT ?;` : "SELECT * FROM cleanups ORDER BY date DESC;";
    
  db.query(q, limit, (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

// @route           GET /api/cleanups/:id
// @description     Get single cleanup action
// @access          Public
router.get("/:id", (req, res) => {
  const actionId = req.params.id;
  const q = "SELECT * FROM cleanups WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else if(data.length === 0) {
      res.status(404).json({ Error: "Cleanup ID not found" })
    } else {
      res.status(200).json(data);
    }
  });
});

// @route           GET /api/cleanups/user/:id
// @description     Get all cleanup actions for a user
// @access          Public
router.get("/user/:id", (req, res) => {
  const actionId = req.params.id;
  const q = "SELECT * FROM cleanups WHERE user_id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else {
      res.status(200).json(data);
    }
  });
});

// @route           POST /api/cleanups
// @description     Create a new cleanup action
// @access          Private
router.post("/", protect, (req, res) => {
  const q = "INSERT INTO cleanups(`title`, `description`, `date`, `location`, `group_size`, `duration`, `env_type`, `total_items`, `total_bags`, `createdAt`, `user_id`) VALUES (?)";

  const values = [
    req.body.title,
    req.body.description,
    req.body.date,
    req.body.location,
    req.body.group_size,
    req.body.duration,
    req.body.env_type,
    req.body.total_items,
    req.body.total_bags,
    req.body.createdAt,
    req.user.id
  ];

  db.query(q, [values], (err, data) => {
    // if (err) {
    //   console.log(`POST /cleanups error: ${err.message}`)
    //   return res.json(err);
    // } else {
    //   console.log(`POST /cleanups: ${res.json(data)}`)
    //   return res.json(data);
    // }
    res.json(data);
  });
});

// @route           DELETE /api/cleanups/:id
// @description     Delete cleanup action
// @access          Private
router.delete("/:id", protect, (req, res) => {
  const actionId = req.params.id;

  const q = "SELECT * FROM cleanups WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    } 
    
    // Check if cleanup exists
    if(data.length === 0) {
      return res.status(404).json({ Error: "Cleanup ID not found" })
    } 

    // Check if user owns cleanup
    if(data[0].user_id !== req.user.id) {
      return res.status(403).json({ Error: 'Not authorized to delete this cleanup.' })
    }

    const delete_q = "DELETE FROM cleanups WHERE id = ? ";

    db.query(delete_q, [actionId], (err, deleteData) => {
      if (err) return res.send(err);
      res.json(deleteData);
    });
  });
});

// @route           PUT /api/cleanups/:id
// @description     Update cleanup action
// @access          Private
router.put("/:id", protect, (req, res) => {
  const actionId = req.params.id;

  const q = "SELECT * FROM cleanups WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    } 
    
    // Check if cleanup exists
    if(data.length === 0) {
      return res.status(404).json({ Error: "Cleanup ID not found" })
    } 

    // Check if user owns cleanup
    if(data[0].user_id !== req.user.id) {
      return res.status(403).json({ Error: 'Not authorized to delete this cleanup.' })
    }

    const q = "UPDATE cleanups SET `title`= ?, `description`= ?, `date`= ?, `location`= ?, `group_size`= ?, `env_type`= ?, `total_items`= ?, `total_bags`= ? WHERE id = ?";

    const values = [
      req.body.title,
      req.body.description,
      req.body.date,
      req.body.location,
      req.body.group_size,
      req.body.env_type,
      req.body.total_items,
      req.body.total_bags
    ];

    db.query(q, [...values,actionId], (err, data) => {
      if (err) return res.send(err);
      res.json(data);
    });
  });
});

export default router;