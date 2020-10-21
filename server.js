require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const axios = require('axios')
const path = require('path')
const {exec} = require("child_process")

const PORT = process.env.PORT || 4000
const ALLOW_COMMANDS = process.env.ALLOW_COMMANDS === 'true'
let curReport = {}

app.use(bodyParser.json())

app.use('/', express.static(path.resolve('./public')))

app.post('/api/report', (req, res) => {
  const {password, report} = req.body
  if(!password || password !== process.env.PASSWORD) return res.status(403).send("You are not authorized.")
  curReport = report
  res.send('ok')
})

app.get('/api/report', (req, res) => {
  const {password} = req.query
  if(!password || password !== process.env.PASSWORD) return res.status(403).send("You are not authorized.")
  res.send(curReport)
})

app.post('/api/run-command', (req, res) => {
  if(!ALLOW_COMMANDS) return res.send("Commands not allowed")
  const {command, password} = req.body
  if(!password || password !== process.env.PASSWORD) return res.status(403).send("You are not authorized.")
  exec(command, (error, stdout, stderr) => {
    let errors = [], result = {};
    if (error) {
        errors.push(error)
    }
    if (stderr) {
        errors.push(stderr)
    }
    result.stdout = stdout
    const toSend = {errors, result}
    res.send(toSend)
  });
})

app.listen(PORT, ()=> {
  console.log("listening on 3000")
  sendReport()
})

function sendReport(){
  exec("ifconfig", (error, stdout, stderr) => {
    let errors = [], result = {};
    if (error) {
        errors.push(error)
    }
    if (stderr) {
        errors.push(stderr)
    }
    result.stdout = stdout
    const toSend = {errors, result}

    axios({
      method: 'post',
      url: `${process.env.REPORTING_HOST}/api/report`,
      data: {password: process.env.PASSWORD, report: toSend}
    })
      .then(()=> console.log("reporting success"))
      .catch(err => console.error(`Reporting Error: ${err.message}`))
  });
}