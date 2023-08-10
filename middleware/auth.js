import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.sendStatus(401);
    }
    
    try {
      // const decoded = jwt.verify(token, process.env.SECRET_KEY, {});

      jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        
        if (err) {
          return res.sendStatus(403);
        }
        
        req.user = user;
        next();
      });

      // req.user = decoded;

      // next();
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: "Authorization header is missing" });
  }
};
