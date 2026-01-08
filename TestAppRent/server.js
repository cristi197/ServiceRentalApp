import express from "express";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync("bookings.json")) {
  fs.writeFileSync("bookings.json", "[]");
}

if (!fs.existsSync("hours.json")) {
  fs.writeFileSync("hours.json", JSON.stringify({ startHour: 9, endHour: 17, description: "Service hours: 9:00 AM to 5:00 PM" }, null, 2));
}

app.post("/book", async (req, res) => {
  const { email, startHour, duration, date } = req.body;

  // Validation: Check required fields
  if (!email || startHour === undefined || !duration || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validation: Check types
  const startHourNum = Number(startHour);
  const durationNum = Number(duration);
  
  if (isNaN(startHourNum) || isNaN(durationNum)) {
    return res.status(400).json({ error: "startHour and duration must be numbers" });
  }

  if (durationNum > 3) {
    return res.status(400).json({ error: "Maxim 3 ore" });
  }

  const endHour = startHourNum + durationNum;

  // Validation: Check if booking exceeds working hours
  let hours;
  try {
    hours = JSON.parse(fs.readFileSync("hours.json"));
  } catch (error) {
    return res.status(500).json({ error: "Error reading hours configuration" });
  }

  if (startHourNum < hours.startHour || endHour > hours.endHour) {
    return res.status(400).json({ 
      error: `Booking outside working hours (${hours.startHour}:00 - ${hours.endHour}:00)` 
    });
  }

  let bookings;
  try {
    const bookingsData = fs.readFileSync("bookings.json", "utf8").trim();
    bookings = bookingsData ? JSON.parse(bookingsData) : [];
  } catch (error) {
    console.error("Error reading bookings:", error);
    bookings = [];
  }
  bookings.push({ ...req.body, endHour, startHour: startHourNum, duration: durationNum });

  fs.writeFileSync("bookings.json", JSON.stringify(bookings, null, 2));

  // EMAIL
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      to: email,
      subject: "Programare service auto",
      text: `Hei! Ai o programare pe ${date} de la ora ${startHourNum}:00 până la ${endHour}:00`
    });
    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    console.log("Note: Email credentials may not be configured. Check .env file.");
  }

  res.json({ success: true, message: "Programare realizată cu succes!" });
});

app.get("/hours", (req, res) => {
  const hours = JSON.parse(fs.readFileSync("hours.json"));
  res.json(hours);
});

app.post("/hours", (req, res) => {
  const { startHour, endHour, description } = req.body;
  
  if (startHour >= endHour || startHour < 0 || endHour > 24) {
    return res.status(400).send("Invalid hours");
  }
  
  fs.writeFileSync("hours.json", JSON.stringify({ startHour, endHour, description }, null, 2));
  res.send("Ore de lucru actualizate!");
});

app.get("/booked-dates", (req, res) => {
  try {
    const bookingsData = fs.readFileSync("bookings.json", "utf8").trim();
    const bookings = bookingsData ? JSON.parse(bookingsData) : [];
    const bookedDates = [...new Set(bookings.map(b => b.date))];
    res.json({ bookedDates });
  } catch (error) {
    res.json({ bookedDates: [] });
  }
});

app.get("/bookings/:date", (req, res) => {
  try {
    const { date } = req.params;
    console.log(`Fetching bookings for date: ${date}`);
    
    const bookingsData = fs.readFileSync("bookings.json", "utf8").trim();
    const bookings = bookingsData ? JSON.parse(bookingsData) : [];
    
    // Get all bookings for this date
    const dateBookings = bookings.filter(b => b.date === date);
    console.log(`Found ${dateBookings.length} bookings for ${date}:`, dateBookings);
    
    // Extract booked hours (both start and end hours)
    const bookedHours = new Set();
    dateBookings.forEach(booking => {
      for (let h = booking.startHour; h < booking.endHour; h++) {
        bookedHours.add(h);
      }
    });
    
    const result = Array.from(bookedHours).sort((a, b) => a - b);
    console.log(`Booked hours for ${date}:`, result);
    res.json({ bookedHours: result });
  } catch (error) {
    console.error("Error reading bookings:", error);
    res.json({ bookedHours: [] });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server pornit pe portul ${PORT}`));
