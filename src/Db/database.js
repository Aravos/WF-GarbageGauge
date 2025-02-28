const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./prices.db");
const { getAllCache, calculateRecentPrice } = require("../cache");

async function InitializeDb() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get("SELECT 1 FROM sqlite_master LIMIT 1", (error, row) => {
                if (error) {
                    console.log("Error Checking Existence:", error.message);
                    return reject(error);
                } else if (!row) {
                    db.run(`CREATE TABLE IF NOT EXISTS prices (
                        item_name TEXT PRIMARY KEY,
                        avg_price REAL,
                        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`, (error) => {
                        if (error) {
                            console.error("Error creating table:", error.message);
                            return reject(error);
                        } else {
                            console.log("Table created successfully.");
                        }
                    }
                    );
                } else {
                    console.log("Table exists");
                }

                db.get(
                    "SELECT 1 FROM prices WHERE DATE(last_updated) = DATE('now') LIMIT 1",
                    async (err, row) => {
                        if (err) {
                            console.error(err.message);
                            return reject(err);
                        } else if (row) {
                            console.log("DB Up to Date");
                            return resolve();
                        } else {
                            const allItems = Object.values(getAllCache());
                            const bulkData = [];
                            for (const item of allItems) {
                                try {
                                    const avgPrice = await calculateRecentPrice(item);
                                    bulkData.push([item, avgPrice]);
                                    console.log(`Updated ${item} -> ${avgPrice} platinum`);
                                } catch (ex) {
                                    console.error(`Error calculating price for ${item}:`, ex);
                                }
                            }
                            if (bulkData.length > 0) {
                                db.serialize(() => {
                                    db.run("BEGIN TRANSACTION");
                                    const stmt = db.prepare(`INSERT INTO prices (item_name, avg_price, last_updated) 
                                        VALUES (?, ?, CURRENT_TIMESTAMP) 
                                        ON CONFLICT(item_name) DO UPDATE SET 
                                        avg_price = excluded.avg_price,
                                        last_updated = CURRENT_TIMESTAMP
                                    `);
                                    bulkData.forEach(([item, avgPrice]) => {
                                        if (avgPrice !== null) {
                                            stmt.run(item, avgPrice);
                                        }
                                    });
                                    stmt.finalize();
                                    db.run("COMMIT", (commitErr) => {
                                        if (commitErr) {
                                            console.error("Commit error:", commitErr.message);
                                            return reject(commitErr);
                                        }
                                        console.log("Database updated with latest prices.");
                                        return resolve();
                                    });
                                });
                            } else {
                                return resolve();
                            }
                        }
                    }
                );
            });
        });
    });
}

async function fetchPrice(itemName) {
    return new Promise((resolve, reject) => {
        db.get("SELECT avg_price FROM prices WHERE item_name = ? LIMIT 1", [itemName], (err, row) => {
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
