import express from "express";
import nodemailer from "nodemailer";
import fs from "fs";

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

  if (duration > 3) {
    return res.status(400).send("Maxim 3 ore");
  }

  const endHour = startHour + duration;

  const bookings = JSON.parse(fs.readFileSync("bookings.json"));
  bookings.push({ ...req.body, endHour });

  fs.writeFileSync("bookings.json", JSON.stringify(bookings, null, 2));

  // EMAIL
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    to: email,
    subject: "Programare service auto",
    text: `Hei! Ai o programare pe ${date} de la ora ${startHour}:00 până la ${endHour}:00`
  });

  res.send("Programare realizată cu succes!");
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server pornit pe portul ${PORT}`));
