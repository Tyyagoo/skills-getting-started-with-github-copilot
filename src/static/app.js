document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

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
