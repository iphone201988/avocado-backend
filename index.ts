import express from "express";
import "dotenv/config";
import morgan from "morgan";
import { connectToDB } from "./src/utils/helper";
import { errorMiddleware } from "./src/middleware/error.middleware";
import router from "./src/route/index.route";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(morgan("tiny"));
app.use(cors({
  origin: "*"
}));

const app2=express();

app.use("/api/v1",router);

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





