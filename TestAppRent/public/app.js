flatpickr("#date", {
  dateFormat: "Y-m-d",
  minDate: "today"
});

const startHour = document.getElementById("startHour");

// Fetch hours from server
async function loadHours() {
  const response = await fetch("/hours");
  const hours = await response.json();
  
  // Populate hours dropdown based on server config
  startHour.innerHTML = "";
  for (let h = hours.startHour; h <= hours.endHour; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = `${h}:00`;
    startHour.appendChild(opt);
  }
}

loadHours();

document.getElementById("bookingForm").addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    nume: nume.value,
    prenume: prenume.value,
    email: email.value,
    telefon: telefon.value,
    date: date.value,
    startHour: Number(startHour.value),
    duration: Number(duration.value)
  };

  const res = await fetch("/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  alert(await res.text());
});
