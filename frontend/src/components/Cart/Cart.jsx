import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import styles from "./cart.module.css";
import axios from "axios";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import Swal from 'sweetalert2'

const Cart = () => {
  const { isLoggedIn, checkAuthentication } = useAuth();

  const [cartData, setCartData] = useState([]);

  const [cookie, setCookie] = useState(null);

  const [socket, setSocket] = useState(null); //For setting the socket connection

  var count = 0;

  const activeProducts = cartData.filter(
    (slide) => slide.is_active === 1 && (count = count + 1)
  );

  useEffect(()=>{
    async function checkCart(){
      try {
        const cookie = await fetch(
          "http://localhost:5000/api/auth/check-cookie",
          {
            method: "GET",
            credentials: "include",
          }
        );
        const cookieData = await cookie.json();
        const res = await axios.get(
          "http://localhost:5000/api/cart/get/cart/" + cookieData
        );

        console.log("Response from the cart");
        console.log(res.data.length);

        if(res.data.length <= 0){
          const overlay = document.createElement("div");
          overlay.classList.add("overlay");
          document.body.appendChild(overlay);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "No Items for Checkout!",
            footer: '<a href="/">Return to Home?</a>',
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "/";
            }
          });
        }
        
      }catch(error){
        console.log("Error");
      }
    }
    checkCart();
  },[])

  const handleQuantityChange = (index, newQuantity) => {
    const updatedCartData = [...cartData];
    updatedCartData[index].total = newQuantity;
    setCartData(updatedCartData);
  };

  useEffect(() => {
    //Calling the function when first render happens of the app...to update the isLoggeid from false to true..by checking the condition.
    checkAuthentication(); // Call this when the component mounts
  }, []);

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    async function fetchCartProducts() {
      try {
        const cookie = await fetch(
          "http://localhost:5000/api/auth/check-cookie",
          {
            method: "GET",
            credentials: "include",
          }
        );
        const cookieData = await cookie.json();

        setCookie(cookieData);

        const cookieRes = await axios.get(
          "http://localhost:5000/api/cart/get/cart/" + cookieData
        );

        const data = cookieRes.data;

        const newData = data.map((product) => {
          const imagesArray = JSON.parse(product.images);
          return {
            ...product,
            images: imagesArray,
          };
        });

        setCartData(newData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchCartProducts();
  }, []);



  useEffect(() => {
    if (socket) {
      socket.on(
        "update_cart_product",
        async ({ product_id, cartItemCount, user_id, total_Price }) => {
          // Find the index of the product in the cartData array
          const productIndex = cartData.findIndex(
            (item) => item.p_id === product_id
          );
          if (productIndex !== -1) {
            // Create a copy of the cartData array
            const updatedCartData = [...cartData];
            // Update the totalPrice of the corresponding product
            updatedCartData[productIndex].totalPrice = parseFloat(total_Price);
            // Update the cartData state with the updated array
            setCartData(updatedCartData);
          }
        }
      );
      socket.on("delete_cart", async({user_id,product_id})=>{
        const cookie = await fetch("http://localhost:5000/api/auth/check-cookie", {
          method: "GET",
          credentials: "include",
        });
        const cookieData = await cookie.json();
        if(cookieData == user_id){
          const productIndex = cartData.findIndex((product)=>product.p_id == product_id);
          if (productIndex !== -1) {
            // Create a copy of the cartData array
            const updatedCartData = [...cartData];
            // Remove the product from the array
            updatedCartData.splice(productIndex, 1);
            // Update the cartData state with the updated array
            setCartData(updatedCartData);
          }
        }
      })
      return () => {
        if (socket) {
          socket.off("update_cart_product");
        }
      };
    }
  }, [cartData, socket]);

  const checkProduct = async (id) => {
    const product = await axios.get(
      "http://localhost:5000/api/product/singleProduct/" + id
    );

    const data = product.data;

    const countProduct = data[0].countInStock;

    return countProduct;
  };

  const updateCartItem = async (productId, newQuantity) => {
    const cookie = await fetch("http://localhost:5000/api/auth/check-cookie", {
      method: "GET",
      credentials: "include",
    });
    const cookieData = await cookie.json();

    // const userId = /* Get the user ID */; // You need to replace this with the actual user ID

    try {
      const response = await axios.put(
        "http://localhost:5000/api/cart/update_cart/" + cookieData,
        {
          product_id: productId,
          quantity: newQuantity,
        }
      );

      // Handle the response as needed
    } catch (error) {
      console.error("Error updating cart item:", error);
      // Handle error
    }
  };

  const deleteCartItem = async (productId) => {

    const cookie = await fetch("http://localhost:5000/api/auth/check-cookie", {
      method: "GET",
      credentials: "include",
    });
    const cookieData = await cookie.json();
    try {
      const response = await axios.delete(
        "http://localhost:5000/api/cart/delete_cart/" + cookieData,{
          data: { product_id: productId }
        } 
      );

      // Handle the response as needed
    } catch (error) {
      console.error("Error updating cart item:", error);
      // Handle error
    }
  };

  // Calculate total price for all items in the cart
  const totalCartPrice = cartData.reduce(
    (total, item) => total + parseFloat(item.totalPrice),
    0
  );

  return (
    <>
      <div className="heading" style={{ marginLeft: "10px" }}>
        <h1>Checkout</h1>
      </div>

      <div className={styles["liton__shoping-cart-area"]}>
        <div className={styles["container"]}>
          <div className={styles["row"]}>
            <div className={styles["col-lg-12"]}>
              <div className={styles["shoping-cart-inner"]}>
                <div className={styles["shoping-cart-table"]}>
                  <table className={styles["table"]}>
                    <tbody>
                      {count > 0 ? (
                        cartData.map((slide, i) => (
                          <tr key={i}>
                            <td className={styles["cart-product-remove"]}>
                              {/* <a onClick={()=>{deleteCartItem(slide.p_id)}} href="#">x</a> */}
                              <button
                                style={{
                                  border: "none",
                                  backgroundColor: "transparent",
                                  padding: "0",
                                }}
                                onClick={() => deleteCartItem(slide.p_id)}
                                type="button"
                              >
                                x
                              </button>
                            </td>
                            <td className={styles["cart-product-image"]}>
                              <a
                                href={`/singleProduct/${slide.p_id}/${slide.productName}`}
                              >
                                <img
                                  src={`http://localhost:5000/${slide.images[0]}`}
                                  alt=""
                                  key={i}
                                />
                              </a>
                            </td>
                            <td className={styles["cart-product-info"]}>
                              <h4>
                                <a href="product-details.html">
                                  {slide.productName}
                                </a>
                              </h4>
                            </td>
                            <td className={styles["cart-product-price"]}>
                              ${slide.totalPrice}
                            </td>
                            <td className={styles["cart-product-quantity"]}>
                              <div className={styles["cart-plus-minus"]}>
                                <button
                                  onClick={async () => {
                                    const isProductAvailable =
                                      await checkProduct(slide.p_id);
                                    if (isProductAvailable > slide.total) {
                                      const newQuantity = slide.total + 1;

                                      handleQuantityChange(i, slide.total + 1);
                                      updateCartItem(slide.p_id, newQuantity);
                                    } else {
                                      // alert("No More Product Available");
                                    }
                                  }}
                                  type="button"
                                  className={styles["cart-plus"]}
                                  data-product-id="1"
                                >
                                  +
                                </button>
                                <input
                                  type="text"
                                  value={slide.total}
                                  name="qtybutton"
                                  className={styles["cart-plus-minus-box"]}
                                />
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      i,
                                      Math.max(0, slide.total - 1),
                                      updateCartItem(
                                        slide.p_id,
                                        slide.total - 1
                                      )
                                    )
                                  }
                                  type="button"
                                  className={styles["cart-minus"]}
                                  data-product-id="1"
                                >
                                  -
                                </button>
                              </div>
                            </td>
                            <td className={styles["cart-product-subtotal"]}>
                              ${slide.totalPrice}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center" }}>
                            Cart Is Empty
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className={styles["row"]}>
            <div className={styles["col-lg-12"]}>
              <div className={styles["cart-subtotal-table"]}>
                <h4>Cart Subtotal</h4>
                <table className={styles["table"]}>
                  <tbody>
                    {count > 0 && (
                      <>
                        {cartData.map((item, index) => (
                          <tr key={index}>
                            <td>{item.productName}</td>
                            <td>${item.totalPrice}</td>
                          </tr>
                        ))}
                        <tr>
                          <td>
                            <strong>Cart Subtotal</strong>
                          </td>
                          <td>
                            <strong>
                              $
                              {cartData
                                .reduce(
                                  (total, item) =>
                                    total + parseFloat(item.totalPrice),
                                  0
                                )
                                .toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td>Shipping and Handling</td>
                          <td>$15.00</td>
                        </tr>
                        <tr>
                          <td>VAT</td>
                          <td>$00.00</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Order Total</strong>
                          </td>
                          <td>
                            <strong>
                              $
                              {(
                                parseFloat(
                                  cartData.reduce(
                                    (total, item) =>
                                      total + parseFloat(item.totalPrice),
                                    0
                                  )
                                ) + 15
                              ).toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                <div className={styles["btn-wrapper"]}>
                  {count > 0 ? (
                    <Link
                      to={`/checkout/${cookie}`}
                      // className={styles["theme-btn-1 btn btn-effect-1"]}
                      className={`${styles["theme-btn-1"]} ${styles["btn"]} ${styles["btn-effect-1"]}`}
                    >
                      Proceed to checkout
                    </Link>
                  ) : (
                    <Link
                      to={"/"}
                      className={styles["theme-btn-1 btn btn-effect-1"]}
                    >
                      Proceed to checkout
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
