import mysql from "mysql2";
import dotenv from "dotenv"

dotenv.config();

// Connects to the MySQL tables 'cleanups', 'diet_meals', and 'users'
export const connectDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.RDS_HOSTNAME, 
            user: process.env.RDS_USERNAME, 
            password: process.env.RDS_PASSWORD, 
            database: process.env.RDS_DATABASE_NAME, 
            port: process.env.RDS_PORT || 3306
        })
        return localConnection;

        // const localConnection = await mysql.createConnection({
        //     host: process.env.LOCAL_PORT,
        //     user: process.env.LOCAL_USERNAME,
        //     password: process.env.MYSQL_PW,
        //     database: "peh_actions",
        //     port: process.env.LOCAL_PORT
        // })
        // return localConnection;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}