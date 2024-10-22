require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new MongoClient(process.env.MONGODB_URI);

// connect mongodb
const dbConnect = async () => {
  try {
    await client.connect();
    console.log("Database connected");
  } catch (error) {
    console.log(error);
  }
};
dbConnect();

// Database collection
const Todo = client.db("todos").collection("todo");

app.get("/", async (req, res) => {
  res.send("Hello from todo api");
});

// get all todos
app.get("/api/tasks", async (req, res) => {
  try {
    const { searchTerm, priority, status } = req.query;
    let query = { isDeleted: { $ne: true } };

    if (searchTerm) {
      query.$or = [
        { name: new RegExp(searchTerm, "i") },
        { description: new RegExp(searchTerm, "i") },
        { category: new RegExp(searchTerm, "i") },
      ];
    }

    if (priority && priority !== "All") {
      query.priority = priority;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    const todos = await Todo.find(query).sort({ date: -1 }).toArray();

    res.send({
      success: true,
      message: "Todos got successfully",
      data: todos,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// create todo
app.post("/api/tasks", async (req, res) => {
  try {
    const todo = req.body;
    const result = await Todo.insertOne({
      ...todo,
      date: new Date(),
      status: "Pending",
      isDeleted: false,
    });

    if (result.insertedId) {
      res.send({
        success: true,
        message: "Successfully insert the todo",
        data: result,
      });
    } else {
      res.send({
        success: false,
        message: "Could not insert the todo",
      });
    }
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// update task
app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const result = await Todo.updateOne(
      { _id: new ObjectId(id) },
      { $set: data },
      { upsert: true }
    );

    res.send({
      success: true,
      message: "Successfully updated task",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.listen(port, () => console.log(`server side is running on port ${port}`));
