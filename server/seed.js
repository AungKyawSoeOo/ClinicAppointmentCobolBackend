const db = require("../db");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    console.log("Starting database updates...");

    // 3. Create default admin user
    const adminEmail = "admin@gmail.com";
    const adminPassword = "admin1234";
    const userRes = await db.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (userRes.rows.length === 0) {
      await db.query("BEGIN");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const insertUserRes = await db.query(`
        INSERT INTO users (email, password, role, status, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING user_id
      `, [adminEmail, hashedPassword, "admin", "active"]);

      const newUserId = insertUserRes.rows[0].user_id;

      await db.query(`
        INSERT INTO patients (user_id, full_name)
        VALUES ($1, $2)
      `, [newUserId, "System Admin"]);

      await db.query("COMMIT");
      console.log(`Default admin user created! Email: ${adminEmail}, Password: ${adminPassword}`);
    } else {
      console.log("Admin user already exists.");
    }

    // 4. Seed initial mock data if cities/townships are empty
    const citiesCount = await db.query("SELECT COUNT(*) FROM cities");
    if (parseInt(citiesCount.rows[0].count) === 0) {
      console.log("Seeding initial cities...");
      const ygn = await db.query("INSERT INTO cities (city_name, city_code, status) VALUES ('Yangon', 'YGN', 'Active') RETURNING city_id");
      const mdy = await db.query("INSERT INTO cities (city_name, city_code, status) VALUES ('Mandalay', 'MDY', 'Active') RETURNING city_id");
      const npt = await db.query("INSERT INTO cities (city_name, city_code, status) VALUES ('Naypyidaw', 'NPT', 'Active') RETURNING city_id");
      const tgi = await db.query("INSERT INTO cities (city_name, city_code, status) VALUES ('Taunggyi', 'TGI', 'Active') RETURNING city_id");

      console.log("Seeding initial townships...");
      await db.query("INSERT INTO townships (city_id, township_name, township_code, status) VALUES ($1, 'Bahan', 'BHN', 'Active')", [ygn.rows[0].city_id]);
      await db.query("INSERT INTO townships (city_id, township_name, township_code, status) VALUES ($1, 'Dagon', 'DGN', 'Active')", [ygn.rows[0].city_id]);
      await db.query("INSERT INTO townships (city_id, township_name, township_code, status) VALUES ($1, 'Tamwe', 'TME', 'Active')", [ygn.rows[0].city_id]);
      await db.query("INSERT INTO townships (city_id, township_name, township_code, status) VALUES ($1, 'Tarkayta', 'TKT', 'Active')", [ygn.rows[0].city_id]);
    }

    console.log("Database updates and seeding completed successfully.");
  } catch (error) {
    console.error("Error during database updates/seeding:", error);
  } finally {
    process.exit(0);
  }
}

seed();
