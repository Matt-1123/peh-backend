import mysql from "mysql2";
import dotenv from "dotenv"

dotenv.config();

// Connects to the MySQL tables 'cleanups' and 'users'
const connectDB = async () => {
    try {
        await mysql.createConnection({
            // host: "localhost",
            host: "127.0.0.1",
            user: "matt",
            password: process.env.MYSQL_PW,
            database: "peh_actions"
        })
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;