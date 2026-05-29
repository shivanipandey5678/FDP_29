import "./utils/loadEnv.js";
import express from "express";
import cors from "cors";
import router from "./routes/workflowRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/workflow", router);

app.get("/", (req, res) => {
  res.send("Backend is running 🌻");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
