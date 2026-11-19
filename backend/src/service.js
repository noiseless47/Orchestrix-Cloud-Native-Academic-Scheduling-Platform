import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import teacherRoutes from "./routes/teacherRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import routineRoutes from "./routes/routineRoutes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

dotenv.config();

const domain = String(process.env.DOMAIN || "").toLowerCase();
const routes = {
  teachers: ["/api/teachers", teacherRoutes],
  subjects: ["/api/subjects", subjectRoutes],
  sections: ["/api/sections", sectionRoutes],
  routines: ["/api/routines", routineRoutes],
};

if (!routes[domain]) {
  console.error("DOMAIN must be one of: teachers, subjects, sections, routines");
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("No Mongo URI provided");
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").filter(Boolean);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(express.json());
app.use(morgan("combined"));
app.get("/api/health", (_req, res) => res.json({ status: "ok", domain }));

const [mountPath, router] = routes[domain];
app.use(mountPath, router);
app.use(notFound);
app.use(errorHandler);

(async () => {
  await connectDB(mongoUri);
  app.listen(port, "0.0.0.0", () => {
    console.log(`${domain} service running on port ${port}`);
  });
})();
