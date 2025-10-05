import express from "express";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { connectDB } from '../config/db.js';

const db = await connectDB();

const router = express.Router();

const doesUsernameExist = (username) => {
  return new Promise((resolve, reject) => {
    const q = 'SELECT * FROM users WHERE username = ?';
    db.query(q, [username], (err, data) => {  
      if (err) {
        console.error('Database error in doesUserExist:', err);
        reject(err);
      } else if (data.length > 0) {
        resolve(true);
      } else {
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
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

// @route         POST api/auth/signup
// @description   Register new user
// @access        Public
router.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;
  
  try {    
    // Input validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, and password are required'
      });
    }

    // Check if username already exists
    const usernameAlreadyExists = await doesUsernameExist(username);
    
    if (usernameAlreadyExists) {
      return res.status(409).json({
        success: false,
        message: 'Username is taken'
      });
    }
    
    // Check if email already exists
    const emailAlreadyExists = await doesEmailExist(email);
    
    if (emailAlreadyExists) {
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

      const userId = data.insertId;

      // Create access token (short-lived)
      const accessToken = jwt.sign(
        { id: userId, type: 'access' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1m' }
      );
      
      // Create refresh token (long-lived)
      const refreshToken = jwt.sign(
        { id: userId, type: 'refresh' }, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // if secure is true, set to none
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Success response
      return res.status(201).json({
        success: true,
        message: 'User account created successfully',
        user: {
          id: userId,
          username,
          email
        },
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

// @route         POST api/auth/login
// @description   Authenticate user
// @access        Public
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if(!email || !password) {
    res.status(400).json({ Error: "Email and password are required" })
  }
  
  const q = 'SELECT * from users WHERE email = ?'

  db.query(q, [req.body.email], (err, data) => {   
    if(err) {
      console.error(err)
      res.status(400).json({Error: err})
    } else if(data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if(err) {
          res.status(400).json({Error: "Login error"})
        } else if(response) {
          const id = data[0].id;
          const username = data[0].username;
          const email = data[0].email;

          // Create access token (short-lived)
          const accessToken = jwt.sign(
            { id, type: 'access' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1m' }
          );
          
          // Create refresh token (long-lived)
          const refreshToken = jwt.sign(
            { id, type: 'refresh' }, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
            { expiresIn: '7d' }
          );
          
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // if secure is true, set to none
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });

          return res.status(201).json({
            message: 'User logged in successfully',
            user: {
              id,
              username,
              email
            },
            accessToken,
            refreshToken: refreshToken.substring(0, 10) + '...' // Only send partial token for security
          });
        } else {
          res.status(401).json({ Error: "Invalid credentials" })
        }
      })
    } else {
      res.status(401).json({ Error: "Invalid credentials" })
    }
  })
});

// @route         POST /logout
// @description   Logout user and clear refresh token
// @access        Private
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // if secure is true, set to none
  })

  res.status(200).json({ message: 'Logged out successfully' })
})

// @route         POST /refresh
// @description   Generate new access token from refresh token
// @access        Public (Requires a valid refresh token in cookie)
router.post("/refresh", (req, res) => {
  // Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ Error: "No refresh token provided" });
  }
  
  // Verify the refresh token
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ Error: "Invalid or expired refresh token" });
    }
    
    // Check if token type is 'refresh'
    if (decoded.type !== 'refresh') {
      return res.status(403).json({ Error: "Invalid token type" });
    }
    
    // Get user data from database to ensure user still exists
    const q = 'SELECT * from users WHERE id = ?';
    db.query(q, [decoded.id], (err, data) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ Error: err });
      } 
      
      if (data.length === 0) {
        return res.status(401).json({ Error: "User not found" });
      }
      
      const user = data[0];
      const { id, username, email } = user;
      
      // Create new access token
      const newAccessToken = jwt.sign(
        { id, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1m' }
      );
      
      // Optionally create new refresh token (token rotation for better security)
      const newRefreshToken = jwt.sign(
        { id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Set new refresh token in cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        secure: true, // TODO: change to the above line
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return res.status(200).json({
        message: 'Token refreshed successfully',
        user: {
          id,
          username,
          email
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken.substring(0, 10) + '...' // Only send partial token for security
      });
    });
  });
});

export default router;