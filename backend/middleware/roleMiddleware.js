const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied — Admin only" });
  }
  next();
};

const requireUser = (req, res, next) => {
  if (req.user.role !== "user" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

module.exports = { requireAdmin, requireUser };