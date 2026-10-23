document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  try {
    const client = await app.initialized();

    document
      .getElementById("escalate-button")
      .addEventListener("click", () => escalate(client));
  } catch (error) {
    console.error("App initialization failed:", error);
    showMessage("Escalation failed");
  }
}

async function escalate(client) {
  const reason = document.getElementById("reason").value;

  if (!reason) {
    showMessage("Choose a reason");
    return;
  }

  try {
    const data = await client.data.get("ticket");
    const ticket = data.ticket;
    const ticketId = String(ticket.display_id ?? ticket.ticket_id ?? ticket.id);
    const isUrgent =
      Number(ticket.priority) === 4 ||
      String(ticket.priority).toLowerCase() === "urgent";

    if (isUrgent) {
      showMessage("Already urgent");
      return;
    }

    await client.request.invokeTemplate("updateTicket", {
      context: { ticket_id: ticketId },
      body: JSON.stringify({
        priority: 4,
        custom_fields: { escalation_reason: reason }
      })
    });

    await client.request.invokeTemplate("addNote", {
      context: { ticket_id: ticketId },
      body: JSON.stringify({ body: `Escalated: ${reason}`, private: true })
    });

    showMessage("");

    try {
      await client.interface.trigger("showNotify", {
        type: "success",
        message: `Ticket escalated: ${reason}`
      });
    } catch (notifyError) {
      console.error("Notification failed:", notifyError);
    }
  } catch (error) {
    console.error("Escalation failed:", error);
    showMessage("Escalation failed");
  }
}

function showMessage(message) {
  document.getElementById("message").textContent = message;
}