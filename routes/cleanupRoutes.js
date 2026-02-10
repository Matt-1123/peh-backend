import express from 'express';
import { connectDB } from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

const db = await connectDB();

// @route           GET /api/debug-connection
// @description     Get the database name and host
// @access          Public

router.get("/debug-connection", async (req, res) => {
  db.query("SELECT DATABASE() as current_db, @@hostname as host", (err, data) => {
    if (err) return res.status(500).json(err);
    
    return res.status(200).json(data);
  });
});

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
      return res.status(500).res.json(err);
    }
    return res.status(200).json(data);
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
      return res.status(500).json(err);
    } else if(data.length === 0) {
      return res.status(404).json({ Error: "Cleanup ID not found" })
    } else {
      return res.status(200).json(data);
    }
  });
});

// @route           GET /api/cleanups/user/:id
// @description     Get all cleanup actions for a user
// @access          Public
router.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const q = "SELECT * FROM cleanups WHERE user_id = ?";
    
  db.query(q, [userId], (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      return res.status(200).json(data);
    }
  });
});

// @route           POST /api/cleanups
// @description     Create a new cleanup action
// @access          Private
router.post("/", protect, (req, res) => {
  const { title, description, date, location, group_size, duration, env_type, total_items, total_bags } = req.body;

  // Validate required fields
  if (!title || !date || !location) {
    return res.status(400).json({ 
      Error: "Missing required fields", 
      required: ["title", "date", "location"] 
    });
  }
  
  const q = "INSERT INTO cleanups (`title`, `description`, `date`, `location`, `group_size`, `duration`, `env_type`, `total_items`, `total_bags`, `createdAt`, `user_id`) VALUES (?)";

  const values = [
    title,
    description,
    date,
    location,
    group_size,
    duration,
    env_type,
    total_items,
    total_bags,
    new Date(),
    req.user.id
  ];


  db.query(q, [values], (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ 
        Error: "Failed to create cleanup action",
        details: err.message 
      });
    }
    
    return res.status(201).json({ 
      message: "Cleanup action created successfully",
      cleanupId: data.insertId,
      data 
    });
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
      return res.status(500).json(err);
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
      if(err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Failed to delete cleanup action",
          details: err.message
        })
      }
      
      return res.status(201).json({
        message: "Cleanup action deleted successfully",
        cleanupId: actionId,
        data: deleteData
      })
    
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
      return res.status(500).json(err);
    } 
    
    // Check if cleanup exists
    if(data.length === 0) {
      return res.status(404).json({ Error: "Cleanup ID not found" })
    } 

    // Check if user owns cleanup
    if(data[0].user_id !== req.user.id) {
      return res.status(403).json({ Error: 'Not authorized to delete this cleanup.' })
    }

    const q = "UPDATE cleanups SET `title`= ?, `description`= ?, `date`= ?, `location`= ?, `group_size`= ?, `duration` = ?, `env_type`= ?, `total_items`= ?, `total_bags`= ? WHERE id = ?";

    const values = [
      req.body.title,
      req.body.description,
      req.body.date,
      req.body.location,
      req.body.group_size,
      req.body.duration,
      req.body.env_type,
      req.body.total_items,
      req.body.total_bags
    ];

    db.query(q, [...values,actionId], (err, data) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Failed to update cleanup action",
          details: err.message
        })
      }

      return res.status(200).json({
        message: "Cleanup action updated successfully",
        cleanupId: actionId,
        data: data
      });
      
    });
  });
});

export default router;