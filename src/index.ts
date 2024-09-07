import { Hono } from "hono";
import auth from "./app/plugins/authPlugin";
import bug from "./app/plugins/bugPlugin";
import solution from "./app/plugins/solutionPlugin";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", auth);
app.route("/bug", bug);
app.route("/solution", solution);

export default app;
