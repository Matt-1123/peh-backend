import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
app.use(cors({
  origin: ["http://localhost:3000/login"],
  methods: ["POST", "GET"],
  credentials: true
})); // allows sending json files via any client (e.g. Postman)
app.use(express.json()); // Middleware to parse JSON
app.use(cookieParser())

const PORT = process.env.PORT || 8000;

// Connects to the tables 'cleanups' and 'users'
const db = mysql.createConnection({
  host: "localhost",
  user: "matt",
  password: process.env.MYSQL_PW,
  database: "peh_actions",
});

app.get("/", (req, res) => {
  res.json("Welcome to the PEH API");
});

const doesUsernameExist = (username) => {
  return new Promise((resolve, reject) => {
    const q = 'SELECT * FROM users WHERE username = ?';
    db.query(q, [username], (err, data) => {  
      console.log('doesUsernameExist data: ', data);
      if (err) {
        console.error('Database error in doesUserExist:', err);
        reject(err);
      } else if (data.length > 0) {
        console.log('Does username exist? True');
        resolve(true);
      } else {
        console.log('Does user exist? False');
        resolve(false);
      }
    });
  });
};

const doesEmailExist = (email) => {
  return new Promise((resolve, reject) => {
    const q = 'SELECT * FROM users WHERE email = ?';
    db.query(q, [email], (err, data) => {  
      if (err) {
        console.error('Database error in doesEmailExist:', err);
        reject(err);
      } else if (data.length > 0) {
        console.log('Does email exist? True');
        resolve(true);
      } else {
        console.log('Does user exist? False');
        resolve(false);
      }
    });
  });
};

// AUTH
app.post("/signup", async (req, res) => {
  try {
    // Input validation
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, and password are required'
      });
    }

    // Check if username already exists
    const usernameAlreadyExists = await doesUsernameExist(username);
    
    if (usernameAlreadyExists) {
      console.log("username already exists");
      return res.status(409).json({
        success: false,
        message: 'Username is taken'
      });
    }
    
    // Check if email already exists
    const emailAlreadyExists = await doesEmailExist(email);
    
    if (emailAlreadyExists) {
      console.log("email already exists");
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Hash password
    const salt = 10;
    const hash = await new Promise((resolve, reject) => {
      bcrypt.hash(password.toString(), salt, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });
    
    // Insert user into database
    const q = "INSERT INTO users(`email`, `password`, `username`) VALUES (?, ?, ?)";
    const values = [email, hash, username];
    
    db.query(q, values, (err, data) => {
      if (err) {        
        return res.status(500).json({
          success: false,
          message: 'Error creating user account'
        });
      }
      
      console.log('signup data: ', data)

      const userId = data.insertId;

      // Create access token (short-lived)
      const accessToken = jwt.sign(
        { id: userId, type: 'access' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '15m' }
      );
      
      // Create refresh token (long-lived)
      const refreshToken = jwt.sign(
        { id: userId, type: 'refresh' }, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      // Set cookies with appropriate settings
      // res.cookie('accessToken', accessToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'strict',
      //   maxAge: 15 * 60 * 1000 // 15 minutes
      // });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // sameSite: 'strict',
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {expiresIn: '1d'});
      // res.cookie('token', token)
      // Success response
      return res.status(201).json({
        success: true,
        message: 'User account created successfully',
        userId,
        accessToken,
        refreshToken: refreshToken.substring(0, 10) + '...' // Only send partial token for security
      });
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post("/login", (req, res) => {
  const q = 'SELECT * from users WHERE email = ?'

  const values = [
    req.body.email,
    req.body.password
  ];

  db.query(q, [req.body.email], (err, data) => {   
    if(err) {
      console.error(err)
      res.json({Error: err})
    } else if(data.length > 0) {
      console.log("data", data)
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if(err) {
          console.log("Login error", err)
          res.json({Error: "Login error"})
        } else if(response) {
          const id = data[0].id;
          const token = jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1d'});
          res.cookie('token', token)
          console.log("Password match: ", response)
          res.json({ Status: "Success" })
        } else {
          console.error("Password is incorrect.")
          res.json({ Error: "Password is incorrect." })
        }
      })
    } else {
      console.error("Email does not exist.")
      res.json({ Error: "Email does not exist." })
    }
  })
});

// @route         GET /user
// @description   Get a user's information
// @access        Private
app.get('/user', (req, res) => {
  res.json('GET request for a user.')
})

// @route         DELETE /user
// @description   Delete a user
// @access        Private
app.delete('/user', (req, res) => {
  res.json('DELETE request for a user.')
})


// ACTIONS

app.get("/cleanups", (req, res) => {
  const limit = parseInt(req.query._limit);
  console.log('limit: ', limit)
  
  const q = limit ? `SELECT * FROM cleanups ORDER BY createdAt DESC LIMIT ?;` : "SELECT * FROM cleanups ORDER BY createdAt DESC;";
    
  db.query(q, limit, (err, data) => {
    if (err) {
      console.error(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/cleanups/:id", (req, res) => {
  const actionId = req.params.id;
  const q = "SELECT * FROM cleanups WHERE id = ?";
    
  db.query(q, [actionId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.post("/cleanups", (req, res) => {
  const q = "INSERT INTO cleanups(`title`, `description`, `date`, `location`, `group_size`, `env_type`, `total_items`, `total_bags`, `createdAt`) VALUES (?)";

  const values = [
    req.body.title,
    req.body.description,
    req.body.date,
    req.body.location,
    req.body.group_size,
    req.body.env_type,
    req.body.total_items,
    req.body.total_bags,
    req.body.createdAt  
  ];

  console.log('db query values: ', values)

  db.query(q, [values], (err, data) => {
    // if (err) {
    //   console.log(`POST /cleanups error: ${err.message}`)
    //   return res.json(err);
    // } else {
    //   console.log(`POST /cleanups: ${res.json(data)}`)
    //   return res.json(data);
    // }
    console.log('POST /cleanups')
    return res.json(data);
  });
});

app.delete("/cleanups/:id", (req, res) => {
  const actionId = req.params.id;
  const q = "DELETE FROM cleanups WHERE id = ? ";

  db.query(q, [actionId], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
  });
});

app.put("/cleanups/:id", (req, res) => {
  const actionId = req.params.id;
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
    return res.json(data);
  });
});

app.listen(PORT, () => {
  console.log("Connected to backend.");
});