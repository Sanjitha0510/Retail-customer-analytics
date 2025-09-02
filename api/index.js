require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const { spawn } = require('child_process');


const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Database Initialization
async function initializeDatabase() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                password VARCHAR(255) NOT NULL,
                verified BOOLEAN DEFAULT 0,
                otp VARCHAR(6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified_at DATETIME
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                customer_id VARCHAR(20),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                address TEXT,
                state VARCHAR(50),
                city VARCHAR(50),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS stocks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                product_id VARCHAR(20),
                product_name VARCHAR(255) NOT NULL,
                quantity INT,
                mrp DECIMAL(10,2),
                price DECIMAL(10,2),
                category VARCHAR(255),
                sub_category VARCHAR(255),
                order_date DATE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("Database tables verified/created");
    } catch (error) {
        console.error("Database initialization failed:", error);
        process.exit(1);
    } finally {
        conn.release();
    }
}

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        
        try {
            const [user] = await pool.query(
                'SELECT id FROM users WHERE id = ? AND verified = 1',
                [decoded.userId]
            );
            if (!user.length) return res.status(403).json({ error: 'User not verified' });
            req.user = { userId: decoded.userId };
            next();
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });
};


const processCustomerCSV = (filePath, userId) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Handle 'cancelled' or 'returned' entries in Total column by assigning null
                let total = row.Total;

                if (total === 'cancelled' || total === 'returned') {
                    total = null;  // Replace 'cancelled' or 'returned' with null
                } else {
                    // If total is not 'cancelled' or 'returned', try to convert to float
                    total = parseFloat(total);
                    if (isNaN(total)) {
                        total = null; // Set to null if it's not a valid float
                    }
                }

                // Ensure fallback for missing or null values in other fields
                const quantity = row.Quantity || 0;
                const discountPrice = row['Discount Price'] || 0;
                

                results.push({
                    user_id:userId,
                    customer_id: row['CustomerID'] || 'N/A',
                    customer_age: row['Customer Age'] || 'N/A',
                    gender: row['Gender'] || 'Unknown',
                    product_name: row['Products'] || 'N/A',
                    mrp: row['MRP'] || 0,
                    discount_percentage: row['Discount Percentage'] || 0,
                    category: row['Category'] || 'N/A',
                    location: row['Location'] || 'Unknown',
                    customer_type: row['CustomerType'] || 'N/A',
                    advertisement: row['Advertisement'] || 'None',
                    returned: row['Returned'] || 0,
                    date: row['Date'] || new Date().toISOString().split('T')[0],
                    total, // Set 'total' to null or valid float
                    order_type: row['Order Type'] || 'Standard',
                    quantity:quantity,
                    discount_price:discountPrice,
                    month: row['Month'] || 'Unknown'
                });
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};


const processStockCSV = (filePath, userId) => {
    return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Ensure 'Price' is a valid number
                const price = parseFloat(row['Price']);
                const validPrice = !isNaN(price) && price >= 0 ? price : null; // Use null if invalid
                
                // Ensure 'Discounted Price' is a valid number
                const discountedPrice = parseFloat(row['Discounted Price']);
                const validDiscountedPrice = !isNaN(discountedPrice) && discountedPrice >= 0 ? discountedPrice : null;
                
                // Ensure 'Quantity' is valid or calculate it
                // const quantity = row['Quantity'] && !isNaN(row['Quantity']) 
                //     ? parseInt(row['Quantity']) 
                //     : (validPrice && row['Sales'] && !isNaN(row['Sales']) ? Math.floor(row['Sales'] / validPrice) : null);

                results.push([
                    userId,
                    row['Product Name']?.trim() || 'Unknown',
                    row['Quantity'] || null,  // Use valid quantity calculation or null
                    validPrice,  // Use valid price or null
                    validDiscountedPrice, // Use valid discounted price or null
                    row['Category'] || 'Unknown',
                    row['SubCategory'] || 'Unknown',
                ]);
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

// CSV Processor
const processCustomerDetailsCSV = async (filePath, userId) => {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv.parse({ columns: true }))
        .on('data', (data) => results.push([
          data.customer_id,
          userId,
          data.customer_type,
          data.loyalty_points,
          data.phone_number
        ]))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  };
  


// Process Customer CSV and upload to DB
// Process Customer CSV and upload to DB
// Process Customer CSV and upload to DB
app.post("/customer/upload", authenticateJWT, upload.single("file"), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Check if the user has inventory in stocks
        const [stockCheck] = await conn.query(
            `SELECT COUNT(*) AS count FROM stocks WHERE user_id = ?`, 
            [req.user.userId]
        );

        if (stockCheck[0].count === 0) {
            throw new Error("Create Inventory");  // If no inventory exists, return message
        }

        // Process uploaded customer CSV data into an array of objects
        const data = await processCustomerCSV(req.file.path, req.user.userId);
        
        // Ensure that data is not empty or invalid before inserting
        if (!data || data.length === 0) {
            throw new Error('No valid data found in the uploaded file');
        }

        // Convert data into a format suitable for bulk insert
        const customerData = data.map(row => [
            row.user_id, row.customer_id, row.customer_age, row.gender, row.product_name, 
            row.mrp, row.discount_percentage, row.category, row.location, row.customer_type,
            row.advertisement, row.returned, row.date, row.total, row.order_type,
            row.quantity, row.discount_price, row.month
        ]);

        // Insert into customers table
        await conn.query(
            `INSERT INTO customers 
            (user_id, customer_id, customer_age, gender, products, mrp, discount_percentage, category, location, 
            customer_type, advertisement, returned, date, total, order_type, quantity, discount_price, month)
            VALUES ?`,
            [customerData]
        );

        // Reduce the stock quantity based on the products from the uploaded customer data
        for (let row of data) {
            const { product_name, quantity } = row; // Use object destructuring to get product name & quantity
            
            // Query to reduce the quantity in the stock table for the respective product
            const [product] = await conn.query(
                `SELECT product_name, quantity FROM stocks WHERE user_id = ? AND product_name = ?`,
                [req.user.userId, product_name]
            );
            
            if (product && product.length > 0) {
                const newQuantity = product[0].quantity - quantity; 

                if (newQuantity >= 0) {
                    // Update the stock quantity for the respective product
                    await conn.query(
                        `UPDATE stocks SET quantity = ? WHERE user_id = ? AND product_name = ?`,
                        [newQuantity, req.user.userId, product_name]
                    );
                } else {
                    throw new Error(`Insufficient stock for ${product_name}`);
                }
            } else {
                console.log(product);
                console.log(row);
                throw new Error(`Product ${product_name} not found in stock`);
            }
        }
        
        await conn.commit();
        res.status(201).json({ imported: data.length });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error(error); // Log the error for debugging
        
        // Send custom error message for "Create Inventory"
        if (error.message === "Create Inventory") {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: error.message });
    } finally {
        if (conn) {
            conn.release();
        }
        fs.unlink(req.file.path, () => {}); // Delete the uploaded file after processing
    }
});



// Process Stock CSV and upload to DB
// Process Stock CSV and upload to DB
app.post("/stock/upload", authenticateJWT, upload.single("file"), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Process the uploaded stock CSV data
        const data = await processStockCSV(req.file.path, req.user.userId);

        // Loop through each product in the data
        for (let row of data) {
            const product_name = row[1]; // Access product_name via index
            let quantity = parseFloat(row[2]);

            // Ensure product_name is not null or empty
            if (!product_name || product_name.trim() === '') {
                throw new Error('Product name cannot be empty or null.');
            }

            // Check if the product already exists in the stocks table
            const [existingProduct] = await conn.query(
                `SELECT * FROM stocks WHERE user_id = ? AND product_name = ?`,
                [req.user.userId, product_name]
            );
            console.log(existingProduct);
            if (existingProduct && existingProduct.length > 0) {
                // Product exists, update the quantity
                const newQuantity = existingProduct[0].quantity + quantity;
                
                // Update the quantity of the existing product
                await conn.query(
                    `UPDATE stocks SET quantity = ? WHERE user_id = ? AND product_name = ?`,
                    [newQuantity, req.user.userId, product_name]
                );
            } else {
                // Product doesn't exist, insert as a new product
                await conn.query(
                    `INSERT INTO stocks (user_id, product_name, quantity, mrp, price, category, sub_category)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [req.user.userId, product_name, quantity, row[3], row[4], row[5], row[6]]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ imported: data.length });
    } catch (error) {
        await conn.rollback();
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
        fs.unlink(req.file.path, () => {}); // Delete the uploaded file after processing
    }
});


  
  // Upload Customers CSV
//   app.post("/customersdetails/upload", authenticateJWT, upload.single("file"), async (req, res) => {
//     const conn = await pool.getConnection();
//     try {
//       await conn.beginTransaction();
//       const data = await processCustomerDetailsCSV(req.file.path, req.user.userId);
  
//       for (let row of data) {
//         const [existingCustomer] = await conn.query(
//           `SELECT * FROM customers_details 
//            WHERE user_id = ? AND customer_id = ?`,
//           [req.user.userId, row[0]]
//         );
  
//         if (existingCustomer.length > 0) {
//           await conn.query(
//             `UPDATE customers_details SET 
//              customer_type = ?, 
//              loyalty_points = ?, 
//              phone_number = ?
//              WHERE user_id = ? AND customer_id = ?`,
//             [row[2], row[3], row[4], req.user.userId, row[0]]
//           );
//         } else {
//           await conn.query(
//             `INSERT INTO customers_details 
//              (customer_id, user_id, customer_type, loyalty_points, phone_number)
//              VALUES (?, ?, ?, ?, ?)`,
//             [row[0], req.user.userId, row[2], row[3], row[4]]
//           );
//         }
//       }
  
//       await conn.commit();
//       res.status(201).json({ imported: data.length });
//     } catch (error) {
//       await conn.rollback();
//       console.error(error);
//       res.status(500).json({ error: error.message });
//     } finally {
//       conn.release();
//       fs.unlink(req.file.path, () => {});
//     }
//   });
  
  
// // Get Customers
// app.get("/api/customersdetails", authenticateJWT, async (req, res) => {
//     try {
//       const [customers] = await pool.query(
//         `SELECT customer_id, phone_number, customer_type, loyalty_points 
//          FROM customers_details 
//          WHERE user_id = ? 
//          ORDER BY customer_id`,
//         [req.user.userId]
//       );
//       res.json(customers);
//     } catch (error) {
//       res.status(500).json({ error: "Failed to fetch customers" });
//     }
//   });

// Get Inventory Data
app.get("/api/stock", authenticateJWT, async (req, res) => {
    try {
      const [stocks] = await pool.query(
        `SELECT product_name, quantity, mrp, price, category 
         FROM stocks 
         WHERE user_id = ? 
         ORDER BY product_name`,
        [req.user.userId]
      );
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });
  
  // Get Sales Data
  app.get("/api/sales", authenticateJWT, async (req, res) => {
    try {
      const [sales] = await pool.query(
        `SELECT customer_id, products, quantity, total, date, order_type, location
         FROM customers 
         WHERE user_id = ? 
         ORDER BY date DESC 
         LIMIT 100`,
        [req.user.userId]
      );
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/stores", authenticateJWT, async (req, res) => {
    try {
      const [stores] = await pool.query(
        `SELECT store_name, address_line_1, country, postal_code
         FROM stores
         WHERE user_id = ?
         LIMIT 1`,
        [req.user.userId]
      );
      res.json(stores[0] || null);
    } catch (error) {
      console.error("Store fetch error:", error);
      res.status(500).json({ error: "Failed to fetch store details" });
    }
  });

  app.post("/api/stores", authenticateJWT, async (req, res) => {
    try {
      const { store_name, address_line_1, country, postal_code } = req.body;
      
      const [result] = await pool.query(
        `INSERT INTO stores (user_id, store_name, address_line_1, country, postal_code)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           store_name = VALUES(store_name),
           address_line_1 = VALUES(address_line_1),
           country = VALUES(country),
           postal_code = VALUES(postal_code)`,
        [req.user.userId, store_name, address_line_1, country, postal_code]
      );
  
      res.json({
        success: true,
        message: result.affectedRows ? "Store details updated successfully" : "Store created successfully"
      });
      
    } catch (error) {
      console.error("Store save error:", error);
      res.status(500).json({ error: "Failed to save store details" });
    }
  });

  app.get("/api/analytics", authenticateJWT, async (req, res) => {
    try {
      const { userId } = req.user;
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
  
      let query = `
        SELECT 
          date, month,
          category,
          gender,
          customer_type,
          location,
          order_type,
          advertisement,
          customer_age,
          discount_percentage,
          mrp,
          returned,
          total,
          products
        FROM customers
        WHERE user_id = ?
      `;
  
      const params = [userId];
  
      const [rawData] = await pool.query(query, params);
  
      // Processing Functions
      const processAgeDistribution = (data) => {
        const ageDist = data.reduce((acc, curr) => {
          const age = parseFloat(curr.customer_age);
          if (!isNaN(age)) {
            const bin = Math.floor(age / 10) * 10;
            const key = `${bin}-${bin + 10}`;
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        }, {});
        return ageDist;
      };
  
      const processGenderSales = (data) => {
        return data.reduce((acc, curr) => {
          if (curr.gender && curr.total) {
            acc[curr.gender] = (acc[curr.gender] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
      };
  
      const processDiscountImpact = (data) => {
        const bins = [0, 10, 20, 30, 40, 50];
        return data.reduce((acc, curr) => {
          const dp = parseFloat(curr.discount_percentage) || 0;
          const bin = bins.find(b => dp <= b) || '40+';
          const label = bin === 50 ? '40+' : `${bin}-${bin + 10}`;
          if (curr.total) {
            acc[label] = (acc[label] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
      };
  
      const processCustomerTypes = (data) => {
        return data.reduce((acc, curr) => {
          if (curr.customer_type && curr.total) {
            acc[curr.customer_type] = (acc[curr.customer_type] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
      };
  
      const processAdvertisementImpact = (data) => {
        return data.reduce((acc, curr) => {
          if (curr.advertisement && curr.total) {
            acc[curr.advertisement] = (acc[curr.advertisement] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
      };
  
      const processAgeSales = (data) => {
        const ageBins = [20, 30, 40, 50, 60, 70];
        return data.reduce((acc, curr) => {
          const age = parseFloat(curr.customer_age);
          if (!isNaN(age) && curr.total) {
            const bin = ageBins.find(b => age <= b) || '60+';
            const label = bin === 70 ? '60+' : `${bin - 10 + 1}-${bin}`;
            acc[label] = (acc[label] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
      };
  
      const processMonthlySales = (data) => {
        return data.reduce((acc, curr) => {
          if (curr.date && curr.total) {
            const month = new Date(curr.date).getMonth() + 1;
            acc[month] = (acc[month] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
      };
  
      const processTopCategories = (data) => {
        const categories = data.reduce((acc, curr) => {
          if (curr.category && curr.total) {
            acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
        
        return Object.entries(categories)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      };
  
      const processReturnRates = (data) => {
        const returns = data.reduce((acc, curr) => {
          if (curr.category) {
            if (!acc[curr.category]) {
              acc[curr.category] = { returns: 0, total: 0 };
            }
            acc[curr.category].returns += parseInt(curr.returned) || 0;
            acc[curr.category].total += 1;
          }
          return acc;
        }, {});
  
        return Object.entries(returns).reduce((acc, [category, data]) => {
          acc[category] = data.returns / data.total;
          return acc;
        }, {});
      };
  
      const processLocationSales = (data) => {
        const locations = data.reduce((acc, curr) => {
          if (curr.location && curr.total) {
            acc[curr.location] = (acc[curr.location] || 0) + parseFloat(curr.total);
          }
          return acc;
        }, {});
        
        return Object.entries(locations)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      };
  
      const processTopSellingProducts = (data) => {
        const priceBins = [0, 500, 1000, Infinity];
        const priceLabels = ['0-500', '500-1000', '1000+'];
        
        const categorySales = data.reduce((acc, curr) => {
          if (curr.category && curr.products && curr.mrp) {
            const price = parseFloat(curr.mrp);
            const binIndex = priceBins.findIndex(bin => price <= bin) - 1;
            const priceRange = priceLabels[binIndex] || priceLabels[priceLabels.length - 1];
            
            if (!acc[curr.category]) {
              acc[curr.category] = {};
            }
            if (!acc[curr.category][priceRange]) {
              acc[curr.category][priceRange] = {};
            }
            
            const products = curr.products.split(',').map(p => p.trim());
            products.forEach(product => {
              acc[curr.category][priceRange][product] = 
                (acc[curr.category][priceRange][product] || 0) + 1;
            });
          }
          return acc;
        }, {});
  
        Object.entries(categorySales).forEach(([category, ranges]) => {
          Object.entries(ranges).forEach(([range, products]) => {
            const maxCount = Math.max(...Object.values(products));
            const topProduct = Object.entries(products)
              .find(([_, count]) => count === maxCount)?.[0];
            categorySales[category][range] = topProduct || 'N/A';
          });
        });
  
        return categorySales;
      };
         

      const processData = (data) => {
        const processed = {
          customerBehavior: {},
          salesAnalysis: {},
          demographics: {},
          topSelling: {}
        };
  
        processed.customerBehavior = {
          ageDistribution: processAgeDistribution(data),
          genderSales: processGenderSales(data),
          discountImpact: processDiscountImpact(data),
          customerTypes: processCustomerTypes(data),
          advertisementImpact: processAdvertisementImpact(data),
          ageSales: processAgeSales(data)
        };
  
        processed.salesAnalysis = {
          monthlySales: processMonthlySales(data),
          topCategories: processTopCategories(data),
          returnRates: processReturnRates(data)
        };
  
        processed.demographics = {
          locationSales: processLocationSales(data)
        };
  
        processed.topSelling = processTopSellingProducts(data);
  
        return processed;
      };
  
      const edaResults = processData(rawData);
      res.json(edaResults);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });
  
 // Function to get top selling products
 const getTopSellingProducts = async (userId) => {
  try {
      const [results] = await pool.query(
          `SELECT products, COUNT(*) as sales_count
           FROM customers
           WHERE user_id = ?
           GROUP BY products
           ORDER BY sales_count DESC
           LIMIT 5`, 
          [userId]
      );
      
      return results.map(row => row.products);
  } catch (error) {
      console.error('Failed to fetch top products:', error);
      throw new Error('Failed to fetch top products');
  }
};

// Generate Reel Endpoint (User ID retrieved from JWT)
app.post('/api/generate-reel', authenticateJWT, async (req, res) => {
  try {
      const userId = req.user.userId; // Retrieve user ID from JWT
      const topProducts = await getTopSellingProducts(userId);

      if (topProducts.length === 0) {
          return res.status(404).json({ error: 'No top products found' });
      }

      const pythonProcess = spawn('py', [
          './videogeneration.py',
          JSON.stringify(topProducts),
      ]);

      let errorOutput = '';

      pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(`Python Error: ${data.toString()}`); // Log error
      });
    

      pythonProcess.on('error', (error) => {
          return res.status(500).json({ 
              error: 'Failed to start video generation',
              details: error.message
          });
      });

      pythonProcess.on('close', (code) => {
          if (code !== 0) {
              return res.status(500).json({ 
                  error: 'Video generation failed',
                  details: errorOutput
              });
          }
          res.json({ success: true });
      });

  } catch (error) {
      console.error('Generate reel error:', error);
      res.status(500).json({ error: error.message });
  }
});

// Post Reel to Instagram (User ID retrieved from JWT)
app.post('/api/post-reel', authenticateJWT, async (req, res) => {
  try {
      const userId = req.user.userId; // Retrieve user ID from JWT
      const videoPath = `./output/reel.mp4`;

      if (!fs.existsSync(videoPath)) {
          return res.status(404).json({ 
              error: 'Video file not found',
              details: 'Please generate the video first'
          });
      }

      const pythonProcess = spawn('py', [
          './instareel.py',
          videoPath
      ]);

      let errorOutput = '';

      pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
          if (code !== 0) {
              return res.status(500).json({ 
                  error: 'Instagram posting failed',
                  details: errorOutput
              });
          }
          res.json({ success: true });
      });

      pythonProcess.on('error', (error) => {
          res.status(500).json({ 
              error: 'Failed to start Instagram posting process',
              details: error.message
          });
      });

  } catch (error) {
      console.error('Instagram posting error:', error);
      res.status(500).json({ 
          error: 'Internal server error',
          details: error.message
      });
  }
});


// User Management Endpoints
// Email and SMS Configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Helper function to send OTP
async function sendOTP(email, phone, otp) {
    let emailFailed = false;
    
    try {
        // Primary email attempt
        await transporter.sendMail({
            from: `"Your App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Verification Code",
            html: `<b>OTP: ${otp}</b>`,
            text: `Your OTP is: ${otp}`
        });
        console.log(`OTP email sent to ${email}`);
    } catch (emailError) {
        console.error("Email delivery failed:", emailError.message);
        emailFailed = true;
    }

    if (emailFailed) {
        try {
            // SMS fallback
            const formattedPhone = phone.replace(/\D/g, '')
                .replace(/^91?/, '+91')
                .replace(/^(\d{10})$/, '+91$1');
            
            await twilioClient.messages.create({
                body: `Your OTP: ${otp}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedPhone
            });
            console.log(`OTP SMS sent to ${formattedPhone}`);
        } catch (smsError) {
            console.error("SMS delivery failed:", smsError.message);
            throw new Error("OTP delivery failed via both email and SMS");
        }
    }
}


// Updated Registration Endpoint
// Modified Registration Endpoint
app.post("/register", async (req, res) => {
    const { name, email, phone, password } = req.body;
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        // Check existing user
        const [existing] = await conn.query(
            'SELECT id FROM users WHERE email = ? OR phone = ?',
            [email, phone]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: "Email or phone already registered" });
        }

        // Generate OTP and hash password
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store user with OTP
        await conn.query(
            `INSERT INTO users (name, email, phone, password, otp)
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, phone, hashedPassword, otp]
        );

        // Send OTP through both channels
        await sendOTP(email, phone, otp);
        
        await conn.commit();
        res.status(201).json({ 
            message: "OTP sent to registered email and phone",
            verificationData: { email, phone, serverOTP: otp } // Only for development
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});

// Simplified Verification Endpoint
app.post("/verify-otp", async (req, res) => {
    const { email, phone, enteredOTP, serverOTP } = req.body;
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        console.log(enteredOTP);
        console.log(serverOTP);
        // Direct comparison without DB lookup
        if (enteredOTP !== serverOTP) {
            await conn.query('DELETE FROM users WHERE email = ? OR phone = ?', [email, phone]);
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // Activate user
        await conn.query(
            `UPDATE users SET 
             verified = 1, 
             otp = NULL,
             verified_at = NOW()
             WHERE email = ? OR phone = ?`,
            [email, phone]
        );
        
        await conn.commit();
        res.json({ message: "Account activated successfully" });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ error: "Verification failed" });
    } finally {
        conn.release();
    }
});

// Updated Login with Device Verification
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const conn = await pool.getConnection();
    
    try {
        const [users] = await conn.query(
            `SELECT * FROM users 
             WHERE email = ?`,
            [email]
        );

        if (!users.length) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!user.verified) {
            return res.status(403).json({ 
                error: "Account not verified. Check your OTP." 
            });
        }

        const token = jwt.sign(
            { userId: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );

        res.json({ 
            message: "Login successful",
            token,
            userId: user.id
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    } finally {
        conn.release();
    }
});

// Server Startup
app.listen(5038, async () => {
    await initializeDatabase();
    console.log("Server running on port 5038");
});
