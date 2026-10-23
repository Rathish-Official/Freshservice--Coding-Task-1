document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  try {
    const client = await app.initialized();

    document
      .getElementById("refresh-button")
      .addEventListener("click", () => loadRequesterTickets(client));

    client.events.on("app.activated", () => loadRequesterTickets(client));
  } catch (error) {
    console.error("App initialization failed:", error);
    showMessage("Could not load tickets");
  }
}

async function loadRequesterTickets(client) {
  const ticketList = document.getElementById("ticket-list");
  ticketList.replaceChildren();
  showMessage("Loading tickets...");

  try {
    const data = await client.data.get("ticket");
    const currentTicket = data.ticket;

    const requesterId = currentTicket.requester_id;
    // the ticket number the API list uses may live in display_id or ticket_id
    const currentTicketId = Number(
      currentTicket.display_id ?? currentTicket.ticket_id ?? currentTicket.id
    );

    if (!requesterId) {
      throw new Error("Requester ID is missing");
    }

    const result = await client.request.invokeTemplate(
      "getRequesterTickets",
      { context: { requester_id: String(requesterId) } }
    );

    const response = JSON.parse(result.response);
    const tickets = Array.isArray(response.tickets) ? response.tickets : [];

    // Urgent (4) first, then High (3), Medium (2), Low (1)
    const priorityOrder = { 4: 0, 3: 1, 2: 2, 1: 3 };

    const otherOpenTickets = tickets
      .filter(ticket =>
        Number(ticket.id) !== currentTicketId &&
        (Number(ticket.status) === 2 || Number(ticket.status) === 3)
      )
      .sort((a, b) =>
        (priorityOrder[Number(a.priority)] ?? 4) -
        (priorityOrder[Number(b.priority)] ?? 4)
      );

    if (otherOpenTickets.length === 0) {
      showMessage("No other open tickets");
      return;
    }

    showMessage("");

    otherOpenTickets.forEach(ticket => {
      const item = document.createElement("p");
      item.textContent = `#${ticket.id} ${ticket.subject || ""}`;
      ticketList.appendChild(item);
    });
  } catch (error) {
    console.error("Could not load tickets:", error);
    ticketList.replaceChildren();
    showMessage("Could not load tickets");
  }
}

function showMessage(message) {
  document.getElementById("message").textContent = message;
}