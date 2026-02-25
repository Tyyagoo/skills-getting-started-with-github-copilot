document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Toast helper: creates container on first use and shows a toast
  function showToast(text, duration = 4000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";

    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const txt = document.createElement("span");
    txt.className = "toast-text";
    txt.textContent = text;

    toast.appendChild(icon);
    toast.appendChild(txt);
    container.appendChild(toast);

    // Auto-remove with fade
    setTimeout(() => {
      toast.classList.add("toast-hide");
      setTimeout(() => container.removeChild(toast), 300);
    }, duration);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset the activity select dropdown to the placeholder
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create card contents using DOM methods (escape user data via textContent)
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;
        activityCard.appendChild(titleEl);

        const descEl = document.createElement("p");
        descEl.textContent = details.description;
        activityCard.appendChild(descEl);

        const scheduleEl = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        scheduleEl.appendChild(scheduleLabel);
        scheduleEl.appendChild(document.createTextNode(details.schedule));
        activityCard.appendChild(scheduleEl);

        const availEl = document.createElement("p");
        const availLabel = document.createElement("strong");
        availLabel.textContent = "Availability: ";
        availEl.appendChild(availLabel);
        availEl.appendChild(document.createTextNode(`${spotsLeft} spots left`));
        activityCard.appendChild(availEl);

        if (details.participants && details.participants.length) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          ul.setAttribute("aria-label", "Participants");

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;
            li.appendChild(span);

            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.setAttribute("aria-label", `Unregister ${p}`);
            delBtn.textContent = "✕";
            delBtn.addEventListener("click", async () => {
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                if (res.ok) {
                  const result = await res.json();
                  showToast(result.message || "Participant unregistered");
                  await fetchActivities();
                } else {
                  const result = await res.json();
                  console.error("Unregister failed:", result);
                }
              } catch (err) {
                console.error("Error unregistering:", err);
              }
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
          });

          activityCard.appendChild(ul);
        } else {
          const noPart = document.createElement("p");
          noPart.className = "no-participants";
          noPart.textContent = "No participants yet";
          activityCard.appendChild(noPart);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list and dropdown to reflect the new signup
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
