import { Hono } from "hono";
import auth from "./app/plugins/authPlugin";
import bug from "./app/plugins/bugPlugin";
import solution from "./app/plugins/solutionPlugin";
import article from "./app/plugins/articlePlugin";
import like from "./app/plugins/likePlugin";
import comment from "./app/plugins/commentPlugin";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", auth);
app.route("/bug", bug);
app.route("/solution", solution);
app.route("/article", article);
app.route("/like", like);
app.route("/comment", comment);

export default app;
