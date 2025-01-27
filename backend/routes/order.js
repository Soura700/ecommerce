const router = require("express").Router();
const connection = require("../connection");
const io = require("../socket");

// router.post("/create-order", async (req, res) => {
//   console.log("Done");
//   try {
//     const {
//       user_id,
//       paymentWay,
//       discount,
//       priceAfterDiscount,
//       totalPrice,
//       orderItems,
//       OrderDetailsID
//     } = req.body;

//     const oneMonthAgo = new Date();
//     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

//     const sqlQuery =
//       " SELECT * FROM users WHERE lastLoginTime >= ? ORDER BY lastLoginTime DESC";

//     // Insert order data into 'orders' table
//     const orderQuery = `
//       INSERT INTO orders (user_id, paymentWay, discount, priceAfterDiscount, totalPrice, order_date , OrderDetailsID)
//       VALUES (?, ?, ?, ?, ?, NOW() , ?)
//     `;
//     const orderValues = [
//       user_id,
//       paymentWay,
//       discount,
//       priceAfterDiscount,
//       totalPrice,
//       OrderDetailsID
//     ];

//     connection.query(orderQuery, orderValues, (orderError, orderResult) => {
//       if (orderError) {
//         console.error("Error creating order:", orderError);
//         res
//           .status(500)
//           .json({ error: "An error occurred while creating the order" });
//         return;
//       }

//       const orderId = orderResult.insertId;

//       // Insert order items into 'order_items' table
//       orderItems.forEach((item) => {
//         const { product_id, cart_id, quantity, price } = item;

//         const orderItemQuery = `
//         INSERT INTO order_items (order_id, product_id, cart_id, quantity, price)
//         VALUES (?, ?, ?, ?, ?)
//       `;
//         const orderItemValues = [orderId, product_id, cart_id, quantity, price];

//         connection.query(orderItemQuery, orderItemValues, (itemError) => {
//           if (itemError) {
//             console.error("Error inserting order item:", itemError);
//           }
//         });

//         // Emit socket event here
//         connection.query(
//           "SELECT * FROM users WHERE id = ?",
//           [user_id],
//           (userError, userResult) => {
//             if (userError) {
//               console.error("Error fetching user:", userError);
//               return;
//             }

//             connection.query(
//               "SELECT * FROM products WHERE p_id = ?",
//               [product_id],
//               (productError, productResult) => {
//                 if (productError) {
//                   console.error("Error fetching product:", productError);
//                   return;
//                 }



//                 // Emit socket event
//                 io.emit("create_order", {
//                   user_id: user_id,
//                   order_item_ids: orderId,
//                   order_ids: orderId,
//                   product_ids: product_id,
//                   user_names: userResult[0].fullname,
//                   product_names: productResult[0].productName,
//                 });
//               }
//             );
//           }
//         );
//       });

//       res.status(201).json({ message: "Order created successfully" });
//     });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while creating the order" });
//   }
// });

router.post("/create-order", async (req, res) => {
  console.log("Called");
  try {
    const {
      user_id,
      paymentWay,
      discount,
      priceAfterDiscount,
      totalPrice,
      orderItems,
      OrderDetailsID
    } = req.body;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Fetch order details based on OrderDetailsID
    const orderDetailsQuery = "SELECT * FROM OrderDetails WHERE OrderDetailsID = ?";
    connection.query(orderDetailsQuery, [OrderDetailsID], (orderDetailsError, orderDetailsResult) => {
      if (orderDetailsError) {
        console.error("Error fetching order details:", orderDetailsError);
        res.status(500).json({ error: "An error occurred while fetching order details" });
        return;
      }
      const orderDetails = orderDetailsResult[0]; // Assuming there's only one order detail for the given OrderDetailsID

      // Insert order data into 'orders' table
      const orderQuery = `
        INSERT INTO orders (user_id, paymentWay, discount, priceAfterDiscount, totalPrice, order_date, OrderDetailsID)
        VALUES (?, ?, ?, ?, ?, NOW(), ?)
      `;
      const orderValues = [
        user_id,
        'COD',
        discount,
        priceAfterDiscount,
        totalPrice,
        OrderDetailsID
      ];

      connection.query(orderQuery, orderValues, (orderError, orderResult) => {
        if (orderError) {
          console.error("Error creating order:", orderError);
          res.status(500).json({ error: "An error occurred while creating the order" });
          return;
        }

        const orderId = orderResult.insertId;

        // Insert order items into 'order_items' table
        orderItems.forEach((item) => {
          const { product_id, cart_id, quantity, price } = item;

          const orderItemQuery = `
            INSERT INTO order_items (order_id, product_id, cart_id, quantity, price)
            VALUES (?, ?, ?, ?, ?)
          `;
          const orderItemValues = [orderId, product_id, cart_id, quantity, price];

          connection.query(orderItemQuery, orderItemValues, (itemError) => {
            if (itemError) {
              console.error("Error inserting order item:", itemError);
            }
          });

          // Emit socket event here
          connection.query(
            "SELECT * FROM users WHERE id = ?",
            [user_id],
            (userError, userResult) => {
              if (userError) {
                console.error("Error fetching user:", userError);
                return;
              }

              connection.query(
                "SELECT * FROM products WHERE p_id = ?",
                [product_id],
                (productError, productResult) => {
                  if (productError) {
                    console.error("Error fetching product:", productError);
                    return;
                  }

                  // Emit socket event
                  io.emit("create_order", {
                    user_id: user_id,
                    order_item_ids: orderId,
                    order_ids: orderId,
                    product_ids: product_id,
                    user_names: userResult[0].fullname,
                    product_names: productResult[0].productName,
                    order_details: orderDetails // Include order details in the socket event data
                  });
                }
              );
            }
          );
        });

        res.status(201).json({ message: "Order created successfully" });
      });
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "An error occurred while creating the order" });
  }
});


// router.post("/create-order", async (req, res) => {
//   try {
//     const {
//       user_id,
//       paymentWay,
//       discount,
//       priceAfterDiscount,
//       totalPrice,
//       orderItems,
//     } = req.body;

//     // Fetch users whose lastLoginTime is within the last 1 month
//     const oneMonthAgo = new Date();
//     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

//     // Perform SQL query to retrieve users
//     const sqlQuery = `
//       SELECT *
//       FROM users
//       WHERE lastLoginTime >= ?
//       ORDER BY lastLoginTime DESC
//     `;

//     connection.query(sqlQuery, [oneMonthAgo], async (sqlError, sqlResults) => {
//       if (sqlError) {
//         console.error("SQL Error:", sqlError);
//         res
//           .status(500)
//           .json({ error: "An error occurred while fetching users" });
//         return;
//       }

//       const usersWithinLastMonth = sqlResults;

//       // Sort users by year, month, and date of lastLoginTime
//       usersWithinLastMonth.sort((userA, userB) => {
//         const dateA = new Date(userA.lastLoginTime);
//         const dateB = new Date(userB.lastLoginTime);

//         // Compare years
//         if (dateA.getFullYear() !== dateB.getFullYear()) {
//           return dateB.getFullYear() - dateA.getFullYear();
//         }

//         // Compare months
//         if (dateA.getMonth() !== dateB.getMonth()) {
//           return dateB.getMonth() - dateA.getMonth();
//         }

//         // Compare dates
//         // return dateB.getDate() - dateA.getDate();

//         // Compare dates
//         if (dateA.getDate() !== dateB.getDate()) {
//           return dateB.getDate() - dateA.getDate();
//         }

//         // Compare hours
//         if (dateA.getHours() !== dateB.getHours()) {
//           return dateB.getHours() - dateA.getHours();
//         }

//         // Compare minutes
//         if (dateA.getMinutes() !== dateB.getMinutes()) {
//           return dateB.getMinutes() - dateA.getMinutes();
//         }
//       });

//       // Select the user with the most recent lastLoginTime (first user in the sorted list)
//       const userToOrder = usersWithinLastMonth[0];

//       // Now, you can create the order using the selected user

//       // Insert order data into 'orders' table
//       const orderQuery = `
//         INSERT INTO orders (user_id, paymentWay, discount, priceAfterDiscount, totalPrice, order_date)
//         VALUES (?, ?, ?, ?, ?, NOW())
//       `;
//       const orderValues = [
//         user_id, // Assuming id is the user's unique identifier
//         paymentWay,
//         discount,
//         priceAfterDiscount,
//         totalPrice,
//       ];

//       connection.query(orderQuery, orderValues, (orderError, orderResult) => {
//         if (orderError) {
//           console.error("Error creating order:", orderError);
//           res
//             .status(500)
//             .json({ error: "An error occurred while creating the order" });
//           return;
//         }

//         const orderId = orderResult.insertId;

//         // Insert order items into 'order_items' table

//         orderItems.forEach((item) => {
//           const { product_id, cart_id, quantity, price } = item;

//           const orderItemQuery = `
//             INSERT INTO order_items (order_id, product_id, cart_id, quantity, price)
//             VALUES (?, ?, ?, ?, ?)
//           `;
//           const orderItemValues = [
//             orderId,
//             product_id,
//             cart_id,
//             quantity,
//             price,
//           ];

//           connection.query(orderItemQuery, orderItemValues, (itemError) => {
//             if (itemError) {
//               console.error("Error inserting order item:", itemError);
//             }
//           });

//           connection.query(
//             "SELECT * FROM users WHERE id = ? ",
//             [user_id],
//             (err, res) => {
//               if (err) {
//                 console.error("Error inserting order item:", err);
//               } else {
//                 connection.query(
//                   "SELECT * FROM products WHERE p_id = ? ",
//                   [product_id],
//                   (error, result) => {
//                     if (err) {
//                       console.error("Error inserting order item:", err);
//                     } else {
//                       console.log(
//                         "user_id:" +
//                           user_id +
//                           "order_item_ids:" +
//                           orderId +
//                           "order_ids:" +
//                           orderId +
//                           "product_ids: " +
//                           product_id +
//                           "user_names:" +
//                           res[0].fullname +
//                           "product_names:" +
//                           result[0].productName
//                       );
//                       io.emit("create_order", {
//                         user_id: user_id,
//                         order_item_ids: orderId,
//                         order_ids: orderId,
//                         product_ids: product_id,
//                         user_names: res[0].fullname,
//                         product_names: result[0].productName,
//                       });
//                     }
//                   }
//                 );
//               }
//             }
//           );
//         });

//         res.status(201).json({ message: "Order created successfully" });
//       });
//     });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while creating the order" });
//   }
// });

// Get data by the user_id

router.get("/get_order", async (req, res) => {
  try {
    const { user_id } = req.params;
    // Perform SQL query to retrieve users
    const sqlQuery =
      //      `SELECT
      //     orders.user_id,
      //     GROUP_CONCAT(order_items.order_item_id) AS order_item_ids,
      //     GROUP_CONCAT(orders.order_id) AS order_ids,
      //     GROUP_CONCAT(DISTINCT orders.order_status) AS order_status,
      //     GROUP_CONCAT(DISTINCT products.p_id) AS product_ids,
      //     GROUP_CONCAT(DISTINCT users.fullname) AS user_names,
      //     GROUP_CONCAT(DISTINCT products.productName) AS product_names

      // FROM order_items
      // JOIN orders ON order_items.order_item_id = orders.order_id
      // JOIN products ON order_items.product_id = products.p_id
      // JOIN users ON orders.user_id = users.id
      // GROUP BY orders.user_id;
      // `;
      `SELECT 
orders.user_id,
GROUP_CONCAT(order_items.order_item_id) AS order_item_ids,
GROUP_CONCAT(DISTINCT orders.order_id) AS order_ids,
GROUP_CONCAT(DISTINCT orders.order_status) AS order_status,
GROUP_CONCAT(DISTINCT order_items.product_id) AS product_ids,
GROUP_CONCAT(DISTINCT users.fullname) AS user_names,
GROUP_CONCAT(DISTINCT products.productName) AS product_names
FROM order_items
JOIN orders ON order_items.order_id = orders.order_id
JOIN users ON orders.user_id = users.id
JOIN products ON order_items.product_id = products.p_id
GROUP BY orders.user_id,orders.order_date;`;

    connection.query(sqlQuery, [user_id], async (sqlError, sqlResults) => {
      if (sqlError) {
        console.error("SQL Error:", sqlError);
        res
          .status(500)
          .json({ error: "An error occurred while fetching users" });
        return;
      } else {
        res.status(200).json(sqlResults);
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the order" });
  }
});

// Change the orde status
router.put("/change_status", (req, res) => {
  const { user_id, new_status, order_id } = req.body;
  const sqlQuery = `UPDATE orders SET order_status = ? WHERE user_id = ? AND order_id = ?`;
  connection.query(
    sqlQuery,
    [new_status, user_id, order_id],
    async (sqlError, sqlResults) => {
      if (sqlError) {
        console.error("SQL Error:", sqlError);
        res
          .status(500)
          .json({ error: "An error occurred while updating status" });
        return;
      } else {
        io.emit("change_status", { user_id: user_id ,new_status: new_status, order_id :order_id });
        res.status(200).json({ message: "Status updated successfully" });
      }
    }
  );
});

router.get("/get_order/:user_id",(req,res)=>{
  const { user_id } = req.params;

  console.log("Called");
  // const sqlQuery = `SELECT * FROM orders WHERE user_id = ? AND order_status != 'completed' `;
  const sqlQuery =`SELECT orders.* , order_items.* , products.* FROM orders JOIN  order_items ON orders.order_id = order_items.order_id JOIN products ON order_items.product_id = products.p_id  WHERE user_id = ? AND order_status != 'completed';`
  connection.query(
    sqlQuery,
    [user_id],
    async (sqlError, sqlResults) => {
      if (sqlError) {
        console.error("SQL Error:", sqlError);
        res
          .status(500)
          .json({ error: "An error occurred while getting the orders" });
        return;
      } else {
        res.status(200).json(sqlResults);
      }
    }
  );
})

// Get the Status of the user_id
router.get("/get_status/:user_id/:order_id", (req, res) => {
  const { user_id, order_id } = req.params;
  const sqlQuery = `SELECT order_status FROM orders WHERE user_id = ? AND order_id = ?`;
  connection.query(
    sqlQuery,
    [user_id, order_id],
    async (sqlError, sqlResults) => {
      if (sqlError) {
        console.error("SQL Error:", sqlError);
        res
          .status(500)
          .json({ error: "An error occurred while updating status" });
        return;
      } else {
        res.status(200).json(sqlResults);
      }
    }
  );
});

module.exports = router;
