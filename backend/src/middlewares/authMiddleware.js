import jwt from "jsonwebtoken";

// Authenticate requests using JWT.
// We trust the token payload for req.user._id to avoid a MongoDB round-trip
// on every single protected API call. The JWT is already cryptographically
// signed — any tampering invalidates the signature.
// Controllers that need the full User document should query it themselves.
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify signature and decode — throws if expired or tampered
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

      // Attach only the user ID from the token payload — no DB round-trip needed.
      // Every controller that previously used req.user._id still works unchanged.
      req.user = { _id: decoded.id };
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
    return;
  }

  res.status(401).json({ message: "Not authorized, no token" });
};

export const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      if (decoded.role !== "student") {
        return res.status(403).json({ message: "Not authorized as student" });
      }
      req.student = decoded; // { roll, name, sessionCode, role }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
    return;
  }
  res.status(401).json({ message: "Not authorized, no student token" });
};
