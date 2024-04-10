const db = require("../config/connection");
var collections = require("../config/collections");
const { ObjectId } = require("mongodb");
var bcrypt = require("bcrypt");

module.exports = {
  doLogin: adminData => {
    return new Promise(async (resolve, reject) => {
      let admin = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then(status => {
          if (status) {
            console.log("Login success");
            resolve({ admin, status: true });
          } else {
            console.log("Login failed");
            resolve({ admin: null, status: false });
          }
        });
      } else {
        console.log("Login failed");
        resolve({ admin: null, status: false });
      }
    });
  },
  getOrders: () => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        // .find({ status: { $ne: "pending" } })
        .find({ $or: [{ status: "placed" }, { status: "dispatched" }] })
        .sort({ date: -1 })
        .toArray()
        .then(res => {
          resolve(res);
        });
    });
  },
  updateOrderStatus: ({ orderId, status }) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne({ _id: new ObjectId(orderId) }, { $set: { status } })
        .then(() => {
          resolve({ status: true });
        });
    });
  },
  getOrderProducts: orderId => {
    return new Promise(async (resolve, reject) => {
      let orderProducts = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: new ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              // #item means 'productId'
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      // console.log(orderProducts);
      resolve(orderProducts);
    });
  },
  getUsersList: () => {
    return new Promise(async (resolve, reject) => {
      let usersList = await db.get().collection(collections.USER_COLLECTION).find().toArray();
      resolve(usersList);
    });
  },
};