/*
 * Main application file
*/
const express = require('express');
const app = express();
const redis = require('redis');
const AWS = require('aws-sdk'); // Load the AWS SDK for Node.js

// set region to aws
AWS.config.update({region: process.env.AWSRegion}); 

// Create an SQS service object
const sqs = new AWS.SQS({ apiVersion: process.env.SQSAPIVersion }); 

// this creates a new client
const redisClient = redis.createClient(); 

// Redis client listener
redisClient.on('connect', function () {
    console.log('Redis client connected');
});
redisClient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

// SET BODYPARSER MIDDLEWARE
app.use(express.json()); 

// CREATE Request Handler
app.post('/api/data', (req, res) => {
    const currentTimestamp = (!Date.now ? +new Date() : Date.now());

    var dataStr = JSON.stringify(req.body)

    var dataKey = 'gamezop_+' + currentTimestamp
    redisClient.SET(dataKey, dataStr, redis.print);

    const MessageBody = dataKey, 
        DelaySeconds = 10,
        QueueUrl =  process.env.SQSQueueURL;

    // Create a new object
    const params = Object.assign({}, { DelaySeconds, MessageBody, QueueUrl });
    
    // send message to sqs
    sqsSendMsgs(params);
    
    // response
    res.end(dataStr);
});

// listion server
const server = app.listen(process.env.PORT || 3000, () => {
    var host = server.address().address
    var port = server.address().port;
    console.log("app listening at http://%s:%s", host, port)
});

// HELPER FUNCTION For send sqs msgs
const sqsSendMsgs = (params) => {
    sqs.sendMessage(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        }
        else {
            console.log("Success", data.MessageId);
        }
    });
}