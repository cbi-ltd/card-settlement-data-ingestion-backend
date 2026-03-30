require('dotenv').config()
import express from "express"
import uploadRoutes from "./routes/uploadRoutes"

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.get("/", (_, res) => { res.send("Welcome To Our Data Pipeline !") })

app.use("/api/data/ingestion", uploadRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})