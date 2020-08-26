const express = require('express');
const fs = require('fs').promises;
const filePath = './data.json';

const app = express();

function checkHttps(request, response, next) {
    // Check the protocol — if http, redirect to https.
    if (request.get("X-Forwarded-Proto").indexOf("https") != -1) {
      return next();
    } else {
      response.redirect("https://" + request.hostname + request.url);
    }
  }
  
  app.all("*", checkHttps)

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/api/tickets', async (req, res) => {
  const tickets = await fs.readFile(filePath);
  const ticketsUnJSONed = JSON.parse(tickets);
  if (req.query.searchText) {
    const filteredTickets = ticketsUnJSONed.filter((ticket) => (ticket.title.toLowerCase().includes(req.query.searchText.toLowerCase()) ? ticket : ''));
    res.send(filteredTickets);
  } else {
    res.send(ticketsUnJSONed);
  }
});

app.post('/api/tickets/:ticketId/done', async (req, res) => {
  const tickets = await fs.readFile(filePath);
  const ticketsUnJSONed = JSON.parse(tickets);
  ticketsUnJSONed.forEach((ticket, i) => {
    if (ticket.id === req.params.ticketId) {
      ticketsUnJSONed[i].done = true;
      ticketsUnJSONed[i].updated = true;
    }
  });
  const ticketsReJSONed = JSON.stringify(ticketsUnJSONed);
  await fs.writeFile(filePath, ticketsReJSONed);
  res.send({ updated: true });
});

app.post('/api/tickets/:ticketId/undone', async (req, res) => {
  const tickets = await fs.readFile(filePath);
  const ticketsUnJSONed = JSON.parse(tickets);
  ticketsUnJSONed.forEach((ticket, i) => {
    if (ticket.id === req.params.ticketId) {
      ticketsUnJSONed[i].done = false;
      ticketsUnJSONed[i].updated = true;
    }
  });
  const ticketsReJSONed = JSON.stringify(ticketsUnJSONed);
  await fs.writeFile(filePath, ticketsReJSONed);
  res.send({ updated: true });
});

module.exports = app;

let port;
console.log("❇️ NODE_ENV is", process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  port = process.env.PORT || 3000;
  app.use(express.static(filePath.join(__dirname, "../build")));
  app.get("*", (request, response) => {
    response.sendFile(filePath.join(__dirname, "../build", "index.html"));
  }); 
} else {
  port = 3001;
  console.log("⚠️ Not seeing your changes as you develop?");
  console.log(
    "⚠️ Do you need to set 'start': 'npm run development' in package.json?"
  );
}

// Start the listener!
const listener = app.listen(port, () => {
  console.log("❇️ Express server is running on port", listener.address().port);
});