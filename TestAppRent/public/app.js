let flatpickrInstance;
const startHour = document.getElementById("startHour");
const dateInput = document.getElementById("date");

// Fetch booked hours for a specific date
async function getBookedHours(date) {
  try {
    const response = await fetch(`/bookings/${date}`);
    const data = await response.json();
    return data.bookedHours || [];
  } catch (error) {
    console.error("Error loading booked hours:", error);
    return [];
  }
}

// Update hours dropdown based on selected date
async function updateAvailableHours(selectedDate) {
  if (!selectedDate) {
    return;
  }
  
  const response = await fetch("/hours");
  const hours = await response.json();
  const bookedHours = await getBookedHours(selectedDate);
  
  // Populate hours dropdown
  startHour.innerHTML = "";
  for (let h = hours.startHour; h <= hours.endHour; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = `${h}:00`;
    
    // Disable if booked
    if (bookedHours.includes(h)) {
      opt.disabled = true;
      opt.textContent += " (zauzeto)";
      opt.style.color = "#ccc";
    }
    
    startHour.appendChild(opt);
  }
}

// Initialize calendar
async function initializeCalendar() {
  flatpickrInstance = flatpickr("#date", {
    dateFormat: "Y-m-d",
    minDate: "today",
    onChange: function(selectedDates) {
      if (selectedDates.length > 0) {
        // Format date as YYYY-MM-DD
        const date = selectedDates[0];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log("Selected date:", dateStr);
        updateAvailableHours(dateStr);
      }
    }
  });
}

// Fetch hours from server
async function loadHours() {
  const response = await fetch("/hours");
  const hours = await response.json();
  
  // Populate hours dropdown with all available hours
  startHour.innerHTML = "";
  for (let h = hours.startHour; h <= hours.endHour; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = `${h}:00`;
    startHour.appendChild(opt);
  }
}

// Check server health and reload if needed
async function checkServerHealth() {
  try {
    const response = await fetch("/health");
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
}

let lastServerStatus = true;
setInterval(async () => {
  const isOnline = await checkServerHealth();
  
  if (!lastServerStatus && isOnline) {
    // Server came back online after being down
    console.log("✅ Server is back online! Reloading app...");
    location.reload();
  }
  
  lastServerStatus = isOnline;
}, 2000);

// Initialize on page load
initializeCalendar();
loadHours();

const form = document.getElementById("bookingForm");
const errorDiv = document.createElement("div");
errorDiv.id = "errorMessage";
errorDiv.style.cssText = `
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
  border-left: 4px solid #f5576c;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  color: #d32f2f;
  font-weight: 500;
  display: none;
`;
form.parentElement.insertBefore(errorDiv, form);

form.addEventListener("submit", async e => {
  e.preventDefault();
  errorDiv.style.display = "none";
  errorDiv.textContent = "";

  // Client-side validation
  if (!nume.value.trim()) {
    showError("Vă rugăm introduceți numele");
    return;
  }
  if (!prenume.value.trim()) {
    showError("Vă rugăm introduceți prenumele");
    return;
  }
  if (!email.value.trim() || !email.value.includes("@")) {
    showError("Email invalid");
    return;
  }
  if (!telefon.value.trim()) {
    showError("Vă rugăm introduceți telefonul");
    return;
  }
  if (!date.value) {
    showError("Vă rugăm selectați data");
    return;
  }
  if (!startHour.value) {
    showError("Vă rugăm selectați ora de start");
    return;
  }
  if (!duration.value) {
    showError("Vă rugăm selectați durata");
    return;
  }

  const data = {
    nume: nume.value,
    prenume: prenume.value,
    email: email.value,
    telefon: telefon.value,
    date: date.value,
    startHour: Number(startHour.value),
    duration: Number(duration.value)
  };

  try {
    const res = await fetch("/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Eroare necunoscută" }));
      showError(errorData.error || "Eroare la programare");
      return;
    }

    const result = await res.json();
    alert("✅ " + result.message);
    form.reset();
    loadHours(); // Reload hours in case they changed
  } catch (error) {
    showError("Eroare de conexiune. Vă rugăm încercați din nou.");
    console.error(error);
  }
});

function showError(message) {
  errorDiv.textContent = "❌ " + message;
  errorDiv.style.display = "block";
}
