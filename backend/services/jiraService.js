const mockTickets = [
  { id: "GIS-223286", title: "STT-PROD4 COLLINE - UNABLE TO RECONNECT", client: "STT", user: "SOCUSER" },
  { id: "GIS-223273", title: "STT-PROD4 REFORMMB - ROUTE SHUTDOWN", client: "STT", user: "SOCUSER" },
  { id: "GIS-223264", title: "LGIM-PROD4 COLLINE - INTEGRATION ROUTE MONITOR", client: "LGIM", user: "SOCUSER" },
  { id: "GIS-223100", title: "SMBC-PROD4 - HIGH MEMORY USAGE", client: "SMBC", user: "SOCUSER" },
  { id: "GIS-223090", title: "GEN-PROD4 - SERVICE UNAVAILABLE", client: "GEN", user: "SOCUSER" },
  { id: "GIS-223080", title: "DEVOPS - PIPELINE FAILURE", client: "Devops", user: "SOCUSER" },
];

const getTicketsByUser = (username) => {
  return mockTickets.filter(t => t.user === username);
};

module.exports = { getTicketsByUser };