import express from "express";
import "dotenv/config";
import morgan from "morgan";
import { connectToDB } from "./src/utils/helper";
import { errorMiddleware } from "./src/middleware/error.middleware";
import router from "./src/route/index.route";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());
app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "src", "public", "success.html"));
});

app.get("/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "src", "public", "cancel.html"));
});

app.post("/webhook", (req, res) => {
  console.log(req.body);
  res.send("successfully submitted")
});
const app2 = express();

app.use("/api/v1", router);


app.use(errorMiddleware);

connectToDB()
  .then(() => {
    console.log("Connected to DB successfully", process.env.MONGO_URI);
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to DB", error);
  });





