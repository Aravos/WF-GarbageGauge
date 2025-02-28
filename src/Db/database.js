const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./prices.db");
const { getAllCache, calculateRecentPrice } = require("../cache");

function runQuery(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

async function InitializeDb() {
    db.serialize(() => {
        db.get("SELECT 1 FROM sqlite_master LIMIT 1", (error, row) => {
            if (error) {
                console.log("Error Checking Existence: ", error.message);
            } else if (row) {
                console.log("Table exists");
            } else {
                db.run(`CREATE TABLE IF NOT EXISTS prices (
                    item_name TEXT PRIMARY KEY,
                    avg_price REAL,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`, (error) => {
                    if (error) {
                        console.error("Error creating table:", error.message);
                    } else {
                        console.log("Table created successfully.");
                    }
                });
            }
        });

        db.get("SELECT 1 FROM prices WHERE DATE(last_updated) = DATE('now') LIMIT 1", async (err, row) => {
            if (err) {
                console.error(err.message);
            } else if (row) {
                console.log("DB Up to Date");
            } else {
                const AllItems = Object.values(getAllCache());
                for (const item of AllItems) {
                    const avgPrice = await calculateRecentPrice(item);
                    await runQuery(`
                        INSERT INTO prices (item_name, avg_price, last_updated) 
                        VALUES (?, ?, CURRENT_TIMESTAMP) 
                        ON CONFLICT(item_name) DO UPDATE SET 
                            avg_price = excluded.avg_price,
                            last_updated = CURRENT_TIMESTAMP
                    `, [item, avgPrice]);
                    console.log(`Row for ${item} inserted or updated successfully.`);
                }
            }
        });
    });
}

async function fetchPrice(itemName) {
    return new Promise((resolve, reject) => {
        db.get('SELECT avg_price FROM prices WHERE item_name = ? LIMIT 1', [itemName], (err, row) => {
            if (err) {
                console.log("Error Fetching", itemName, "price.");
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = { InitializeDb, fetchPrice };