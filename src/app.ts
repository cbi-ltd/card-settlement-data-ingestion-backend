import express from "express"
import uploadRoutes from "./routes/uploadRoutes"

const app = express()

app.use(express.json())

app.use("/api/data/ingestion", uploadRoutes)

app.listen(3000, () => {
 console.log("Server running on port 3000")
})