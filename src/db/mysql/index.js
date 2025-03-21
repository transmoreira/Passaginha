import { configDotenv } from 'dotenv'
import mysql from 'mysql'
configDotenv()

const executeSql = (conn, sql) =>
	new Promise((resolve, reject) => {
		conn.connect(function (err) {
			if (err) {
				conn.destroy()
				return reject(err)
			}
			conn.query(sql, function (err, result) {
				conn.destroy()
				if (err) {
					return reject(err)
				}
				return resolve(result)
			})
		})
	})

export const Passenger = async (sql) => {
	const conn = mysql.createConnection({
		host: process.env.HOST,
		user: process.env.USER,
		password: process.env.PASSWORD,
		database: process.env.DATABASE,
	})

	return await executeSql(conn, sql)
}
