import mysql from "mysql2";
import dotenv from "dotenv"

dotenv.config();

// Connects to the MySQL tables 'cleanups' and 'users'
export const connectDB = async () => {
    try {
        const connection = await mysql.createConnection({
            // host: "localhost",
            host: "127.0.0.1",
            user: "matt",
            password: process.env.MYSQL_PW,
            database: "peh_actions"
        })
        return connection;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}