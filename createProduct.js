const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const product = new Product({
            name: "Luxury Watch Model X",
            price: 999.99,
            description: "A beautiful luxury watch with premium features",
            image: "watch1.jpg"
        });
        await product.save();
        console.log("Product created with ID:", product._id.toString());
        console.log("View it at: http://localhost:5501/product/" + product._id);
        mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        mongoose.disconnect();
    }
});