import { Hono } from "hono";
import auth from "./app/plugins/authPlugin";
import bug from "./app/plugins/bugPlugin";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", auth);
app.route("/bug", bug);

export default app;
