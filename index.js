const express = require('express')

const cors = require('cors')
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const fs = require('fs-extra')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.static('doctors'));
app.use(fileUpload());
app.use(bodyParser.json())

const port = process.env.PORT || 5000

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.o1cg3.mongodb.net/${ process.env.DB_NAME }?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) =>
{
    res.send('server connected')
})


client.connect(err =>
{
    const appointmentCollection = client.db("doctorsportaldb").collection("appointments");
    const doctorCollection = client.db("doctorsportaldb").collection("doctors");
    app.post('/addAppointment', (req, res) =>
    {
        const newAppointment = req.body;
        appointmentCollection.insertOne(newAppointment)
            .then(result =>
            {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/appointments', (req, res) =>
    {
        appointmentCollection.find({})
            .toArray((err, documents) =>
            {
                res.send(documents);
            })
    })

    app.post('/appointmentsByDate', (req, res) =>
    {
        const date = req.body;
        const email = req.body.email;

        doctorCollection.find({ email: email })
            .toArray((error, doctors) =>
            {
                const filter = { date: date.date }
                if (doctors.length === 0)
                {
                    filter.email = email
                }

                appointmentCollection.find(filter)
                    .toArray((error, documents) =>
                    {
                        res.send(documents)
                    })

            })
    })

    app.post('/addADoctor', (req, res) =>
    {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;

        const newImg = file.data;
        const encImg = newImg.toString('base64');

        let image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result =>
            {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/doctors', (req, res) =>
    {
        doctorCollection.find({})
            .toArray((err, documents) =>
            {
                res.send(documents);
            })
    });

    app.post('/isDoctor', (req, res) =>
    {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) =>
            {
                res.send(doctors.length > 0);
            })
    })
});

app.listen(port)