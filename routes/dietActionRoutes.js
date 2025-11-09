import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/db.js';

const db = await connectDB();

// @route           GET /api/diet/meals
// @description     Get all diet action meals
// @access          Public
router.get("/meals", (req, res) => {  
  const q = "SELECT * FROM diet_meals ORDER BY date DESC;";
    
  db.query(q, (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

// @route           GET /api/diet/meals/:id
// @description     Get single diet action meal
// @access          Public
router.get("/meals/:id", (req, res) => {
  const actionId = req.params.id;
  const q = "SELECT * FROM diet_meals WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else if(data.length === 0) {
      res.status(404).json({ Error: "Diet action meal ID not found" })
    } else {
      res.status(200).json(data);
    }
  });
});

// @route           GET /api/diet/meals/user/:id
// @description     Get all diet action meals for a user
// @access          Public
router.get("/user/:id", (req, res) => {
  const actionId = req.params.id;
  const q = "SELECT * FROM diet_meals WHERE user_id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else {
      res.status(200).json(data);
    }
  });
});

// @route           POST /api/diet/meals
// @description     Create a new diet action meal
// @access          Private
router.post("/", protect, (req, res) => {
  const q = "INSERT INTO diet_meals(`title`, `description`, `date`, `location`, `group_size`, `env_type`, `total_items`, `total_bags`, `createdAt`, `user_id`) VALUES (?)";

  const values = [
    req.body.title,
    req.body.description,
    req.body.date,
    req.body.location,
    req.body.group_size,
    req.body.env_type,
    req.body.total_items,
    req.body.total_bags,
    req.body.createdAt,
    req.user.id
  ];

  console.log('db query values: ', values)

  db.query(q, [values], (err, data) => {
    // if (err) {
    //   console.log(`POST /diet_meals error: ${err.message}`)
    //   return res.json(err);
    // } else {
    //   console.log(`POST /diet_meals: ${res.json(data)}`)
    //   return res.json(data);
    // }
    console.log('POST /diet_meals')
    res.json(data);
  });
});

// @route           DELETE /api/diet/meals/:id
// @description     Delete diet action meal
// @access          Private
router.delete("/:id", protect, (req, res) => {
  const actionId = req.params.id;

  const q = "SELECT * FROM diet_meals WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    } 
    
    // Check if diet action meal exists
    if(data.length === 0) {
      return res.status(404).json({ Error: "Diet action ID not found" })
    } 

    // Check if user owns diet action meal
    if(data[0].user_id !== req.user.id) {
      return res.status(403).json({ Error: 'Not authorized to delete this action.' })
    }

    const delete_q = "DELETE FROM diet_meals WHERE id = ? ";

    db.query(delete_q, [actionId], (err, deleteData) => {
      if (err) return res.send(err);
      res.json(deleteData);
    });
  });
});

// @route           PUT /api/diet/meals/:id
// @description     Update diet action meal
// @access          Private
router.put("/:id", protect, (req, res) => {
  const actionId = req.params.id;

  const q = "SELECT * FROM diet_meals WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    } 
    
    // Check if cleanup exists
    if(data.length === 0) {
      return res.status(404).json({ Error: "Diet action meal ID not found" })
    } 

    // Check if user owns action
    if(data[0].user_id !== req.user.id) {
      return res.status(403).json({ Error: 'Not authorized to delete this action.' })
    }

    const q = "";

    const values = [
      
    ];

    db.query(q, [...values,actionId], (err, data) => {
      if (err) return res.send(err);
      res.json(data);
    });
  });
});

export default router;