const express = require("express");
const router = express.Router();
const PageContent = require("../models/PageContent");
const Message = require("../models/Message"); // Add this line

router.get("/about", async (req, res) => {
  try {
    const page = await PageContent.findOne({ page: "about" });
    res.render("about", { 
      content: page?.content || "Default About Content",
      user: req.session.user 
    });
  } catch (error) {
    console.error("Error fetching about page:", error);
    res.render("about", { content: "Default About Content", user: req.session.user });
  }
});

router.get("/terms", async (req, res) => {
  try {
    const page = await PageContent.findOne({ page: "terms" });
    res.render("terms", { 
      content: page?.content || "Default Terms Content",
      user: req.session.user 
    });
  } catch (error) {
    console.error("Error fetching terms page:", error);
    res.render("terms", { content: "Default Terms Content", user: req.session.user });
  }
});

router.get("/contact", async (req, res) => {
  try {
    const page = await PageContent.findOne({ page: "contact" });
    res.render("contact", { 
      content: page?.content || "Default Contact Info",
      user: req.session.user 
    });
  } catch (error) {
    console.error("Error fetching contact page:", error);
    res.render("contact", { content: "Default Contact Info", user: req.session.user });
  }
});

router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new Message({
      name,
      email,
      message
    });
    await newMessage.save();
    res.render("contact-success");
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).render("contact", { 
      content: "There was an error sending your message. Please try again.",
      user: req.session.user 
    });
  }
});

module.exports = router;