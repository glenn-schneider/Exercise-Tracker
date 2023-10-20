const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//SCHEMAS
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: String
});
const User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  username: String,
  description: { type: String, required: true},
  duration: {type: Number, required: true},
  date: String,
  userID: String
});
const Exercise = mongoose.model('Exercise', exerciseSchema);


//CREATE A NEW USER
app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;
    const newUser = new User({ username: username });
    await newUser.save();
    res.json({
      username: newUser.username,
      _id: newUser._id 
    })
  } catch (err) {
    console.log(err);
  }
})

//GET ALL USERS
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users)
  } catch (err) {
    console.log(err);
  }
})

//ADD EXERCISE
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const id = req.params._id;
    const description = req.body.description;
    const duration = req.body.duration;
    const date = req.body.date ? req.body.date : new Date().toISOString().substring(0, 10);
    const user = await User.findById(id).select("username");

    const newExercise = new Exercise({
      username: user.username,
      description: description,
      duration: duration,
      date: date,
      userID: id
    })
    
    await newExercise.save();
    
    res.json({
      username: newExercise.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString(),
      _id: user._id
    });
    
  } catch (err) {
    console.log(err);
  }
})

//GET USER EXERCISES
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const id = req.params._id;
    const from = req.query.from ? req.query.from : new Date(0).toISOString().substring(0, 10)
    const to = req.query.to ? req.query.to : new Date().toISOString().substring(0, 10)
    const limit = req.query.limit ? req.query.limit : 0;
    const user = await User.findById(id).select("username");

    const userExercises = await Exercise.find({
      userID: id,
      date: {$gte: from, $lte: to}
    })
    .limit(limit)
    .select("description duration date")

    const exerciseLog = userExercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      };
    });

    res.json({
      _id: user._id,
      username: user.username,
      count: exerciseLog.length,
      log: exerciseLog
    });
  } catch (err) {
    console.log(err);
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
