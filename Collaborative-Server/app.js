var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var queryString = require('querystring');
var urlParser = require('url');
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://ShruthiUser:ShruthiUser@cluster0-zanse.mongodb.net';

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));


var dirName = __dirname + '\\UserProjects';


var auth = require('./auth');
var projectManager = require('./projectManager');
var notification = require('./notification');
var share = require('./shareProject');
var docHandler = require('./session_manager');


var sessionManager = new docHandler.SessionManager();


//mongoose.connect('mongodb://localhost:27017');
//var conn = mongoose.connection;
try {
    var conn = mongoose.connect(MONGODB_URL + '/ShruthiUser?retryWrites=true&w=majority',
        { useNewUrlParser: true, useUnifiedTopology: true });
} catch (error) {
    console.log(error);
}

app.use("/register", function(req, res) {
    var parsedQuery = extractQuery(req.url);

    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>req, res", req, res);
    sessionManager.handleRegister(req, res, parsedQuery.userId, parsedQuery.docId);
})

app.use("/unregister", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    sessionManager.handleUnregister(req, res, parsedQuery.userId, parsedQuery.docId);
})

app.use("/get_operation", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>req, res", req, res);
    sessionManager.handleGet(req, res, parsedQuery.userId, parsedQuery.docId);
})

app.use("/push_operation", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    sessionManager.handlePush(req, res, parsedQuery.userId, parsedQuery.docId);
})


app.use("/view", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    projectManager.view(req, res, parsedQuery.path);
})

app.use("/get_info", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    auth.getInfo(req, res);
})

app.use("/add_node", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    projectManager.addNode(req, res, parsedQuery.path);
})


app.use("/login", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    auth.logIn(req, res);
})

app.use("/signup", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    auth.signUp(req, res);
})

app.use("/get_users", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    auth.getUsers(req, res);
})


app.use("/share", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>req, res", req, res);
    share.share(req, res, parsedQuery.docId, parsedQuery.userId, parsedQuery.shareId);
})

app.use("/get_shared_projects", function(req, res) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>req, res", req, res);
    var parsedQuery = extractQuery(req.url);
    share.getSharedProjects(req, res, parsedQuery.userId);
})


app.use("/get_notifications", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    notification.getNotifications(req, res, parsedQuery.userId);
})

app.use("/clear_notifications", function(req, res) {
    var parsedQuery = extractQuery(req.url);
    notification.clearAll(req, res, parsedQuery.userId);
})


function extractQuery(url) {
    var parsedURL = urlParser.parse(url);
    var query = parsedURL.query;
    var parsedQuery = queryString.parse(query);
    return parsedQuery;
}

module.exports = app;
