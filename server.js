const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser = require("body-parser");
const mongoose = require('mongoose');
const mongodb = require('mongodb')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

let User = mongoose.model('User', userSchema)
let Exercise = mongoose.model('Exercise', exerciseSchema)

app.post('/api/exercise/new-user', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let newUser = new User({username: req.body.username})
  newUser.save((error, savedUser) => {
    if(error) console.log(error)
    res.json({username: savedUser.username, _id: savedUser.id})
  })
})

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, arrayOfUsers) => {
    if (err) console.log(err)
    res.json(arrayOfUsers)
  })
})

app.post('/api/exercise/add', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let newExercise = new Exercise({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })

  if(newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0,10)
  }

  User.findByIdAndUpdate(
    req.body.userId,
    {$push: {log: newExercise}},
    {new: true},
    (err, updatedUser) => {
      if(!err) {
        let resObject = {}
        resObject["_id"] = updatedUser.id
        resObject["username"] = updatedUser.username
        resObject["description"] = newExercise.description
        resObject["duration"] = newExercise.duration
        resObject["date"] = new Date(newExercise.date).toDateString()
        res.json(resObject)
      }
    })
})

app.get('/api/exercise/log', (req, res) => {
  User.findById(req.query.userId, (error, result) => {
    if(!error) {
      let responseObject = result

      if (req.query.from || req.query.to) {
        let fromDate = new Date(0)
        let toDate = new Date()

        if(req.query.from) {
          fromDate = new Date(req.query.from)
        }

        if(req.query.to) {
          toDate = new Date(req.query.to)
        }

        fromDate = fromDate.getTime()
        toDate = toDate.getTime()

        responseObject.log = responseObject.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()

          return sessionDate >= fromDate && sessionDate <= toDate
        })

      }

      if (req.query.limit) {
        responseObject.log = responseObject.log.slice(0, req.query.limit)
      }

      responseObject = responseObject.toJSON()
      responseObject['count'] = result.log.length
      res.json(responseObject)
    }
  })
})








const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
