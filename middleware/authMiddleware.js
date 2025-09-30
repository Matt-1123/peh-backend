import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import mysql from "mysql2";

dotenv.config();

const db = mysql.createConnection({
  host: "localhost",
  user: "matt",
  password: process.env.MYSQL_PW,
  database: "peh_actions",
});

export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ Error: 'Not authorized. No token.' })
        }

        const token = authHeader.split(' ')[1];
        
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
              return res.status(401).json({ Error: "Invalid or expired token" });
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
              
              req.user = { id, username, email }

              next();
            });
        });
    } catch (err) {
        console.error(err);
        res.status(401);
        next(new Error('Not authorized. Token failed.'))
    }
}
