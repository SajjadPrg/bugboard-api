import { Hono } from "hono";
import { config } from "dotenv";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

// Import plugins (modular route handlers)
import auth from "./app/plugins/authPlugin";
import bug from "./app/plugins/bugPlugin";
import solution from "./app/plugins/solutionPlugin";
import article from "./app/plugins/articlePlugin";
import like from "./app/plugins/likePlugin";
import comment from "./app/plugins/commentPlugin";

// Load environment variables from .env file
config();

// Initialize Hono app
const app = new Hono();

// Apply middleware
app.use(logger()); // Log all requests
app.use(cors()); // Enable CORS

// Root route
app.get("/", (c) => {
  try {
    return c.text("Hello, Welcome to BugBoardApi!");
  } catch (error) {
    console.error("Error handling root route:", error);
    return c.text("Internal Server Error", 500);
  }
});

// Route plugins (modular route handlers)
app.route("/auth", auth);
app.route("/bug", bug);
app.route("/solution", solution);
app.route("/article", article);
app.route("/like", like);
app.route("/comment", comment);

// Export the Hono app instance
export default app;
