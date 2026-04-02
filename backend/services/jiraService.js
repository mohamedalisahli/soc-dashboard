const mockTickets = [
  // ========== SAAS TICKETS ==========
  { id: "GIS-223286", title: "STT-PROD4 COLLINE - UNABLE TO RECONNECT", type: "SAAS", client: "STT", group_name: null, user: "SOCUSER", created_at: "2026-03-25" },
  { id: "GIS-223273", title: "STT-PROD4 REFORMMB - ROUTE SHUTDOWN", type: "SAAS", client: "STT", group_name: null, user: "SOCUSER", created_at: "2026-03-25" },
  { id: "GIS-223264", title: "LGIM-PROD4 COLLINE - INTEGRATION ROUTE MONITOR", type: "SAAS", client: "LGIM", group_name: null, user: "SOCUSER", created_at: "2026-03-26" },
  { id: "GIS-223100", title: "SMBC-PROD4 - HIGH MEMORY USAGE", type: "SAAS", client: "SMBC", group_name: null, user: "SOCUSER", created_at: "2026-03-26" },
  { id: "GIS-223090", title: "GEN-PROD4 - SERVICE UNAVAILABLE", type: "SAAS", client: "GEN", group_name: null, user: "SOCUSER", created_at: "2026-03-27" },
  { id: "GIS-223080", title: "DEVOPS - PIPELINE FAILURE", type: "SAAS", client: "Devops", group_name: null, user: "SOCUSER", created_at: "2026-03-27" },

  // ========== ON-PREM TICKETS ==========
  { id: "GIS-223300", title: "GIS - SERVER UNREACHABLE", type: "ONPREM", client: null, group_name: "GIS", user: "SOCUSER", created_at: "2026-03-28" },
  { id: "GIS-223301", title: "GIS - DISK SPACE CRITICAL", type: "ONPREM", client: null, group_name: "GIS", user: "SOCUSER", created_at: "2026-03-28" },
  { id: "GIS-223302", title: "BDO - DATABASE CONNECTION FAILED", type: "ONPREM", client: null, group_name: "BDO", user: "SOCUSER", created_at: "2026-03-29" },
  { id: "GIS-223303", title: "BDO - BACKUP JOB FAILED", type: "ONPREM", client: null, group_name: "BDO", user: "SOCUSER", created_at: "2026-03-29" },
  { id: "GIS-223304", title: "CDO - DATA PIPELINE ERROR", type: "ONPREM", client: null, group_name: "CDO", user: "SOCUSER", created_at: "2026-03-30" },
  { id: "GIS-223305", title: "CDO - ETL JOB TIMEOUT", type: "ONPREM", client: null, group_name: "CDO", user: "SOCUSER", created_at: "2026-03-30" },
  { id: "GIS-223306", title: "DO - DEPLOYMENT FAILURE", type: "ONPREM", client: null, group_name: "DO", user: "SOCUSER", created_at: "2026-03-31" },
  { id: "GIS-223307", title: "DO - SERVICE RESTART REQUIRED", type: "ONPREM", client: null, group_name: "DO", user: "SOCUSER", created_at: "2026-03-31" },
  { id: "GIS-223308", title: "EIP - INTEGRATION BRIDGE DOWN", type: "ONPREM", client: null, group_name: "EIP", user: "SOCUSER", created_at: "2026-04-01" },
  { id: "GIS-223309", title: "EIP - MESSAGE QUEUE FULL", type: "ONPREM", client: null, group_name: "EIP", user: "SOCUSER", created_at: "2026-04-01" },
];

const getTicketsByUser = (username) => {
  return mockTickets.filter(t => t.user === username);
};

const getSaasTickets = (username) => {
  return mockTickets.filter(t => t.user === username && t.type === "SAAS");
};

const getOnPremTickets = (username) => {
  return mockTickets.filter(t => t.user === username && t.type === "ONPREM");
};

module.exports = { getTicketsByUser, getSaasTickets, getOnPremTickets };