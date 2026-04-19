import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];
            console.log("TOKEN:", token);

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("DECODED:", decoded);

            // Get user from the token, exclude password
            req.user = await User.findById(decoded.id).select("-password");
            console.log("USER:", req.user);

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

export { protect };
