
var mongoose = require('mongoose');
var fs = require('fs');
var mkdirp = require('mkdirp');
var crypto = require('crypto');


var Schema = mongoose.Schema;

var fileSchema = new Schema({
    fileID: String,
    fileName: String,
    path: String
});
var file = mongoose.model('files', fileSchema);

var collectionSchema = new Schema({
    collectionName: String,
    path: String
});
var collection = mongoose.model('collection', collectionSchema);

var userProjectSchema = new Schema({
    userID: String,
    projectPath: String
});
var userProject = mongoose.model('userProject', userProjectSchema);


var dirName = __dirname + "\\UserProjects";


module.exports = {

    file : mongoose.model('files', fileSchema),

    
    view : function(request, response, path) {
        try {
            //resolves directory path. For more information about 'resolution' consult resolve function
            var resolvedPath = dirName + resolve(path);
            getCollectionContent(path, resolvedPath, function(content) {
                console.log(content);
                response.json(content);
                response.end();
            });
        } catch (err) {
            console.log(err.stack);
            response.end();
        }
    },

    
    addNode : function(request, response, path) {
        try {
            var node = request.body;
            console.log(node);
            var resolvedPath = dirName + resolve(path);
            if (node.type == 'DOC') {
                //resolves directory path. For more information about 'resolution' consult resolve function

                //complete file path
                var filePath = resolvedPath + '\\' + node.name;

                //generate a unique docId for the newly added Doc
                var docId = crypto.createHash('md5').update(filePath).digest("hex");

                //add the node to the tree
                new file({
                    fileID: docId,
                    fileName: node.name,
                    path: path
                }).save(function(err, newFile){
                        if (err){
                            throw err;
                        } else{
                            //writes the file to the directory
                            fs.writeFile(filePath, "", function(err) {
                                var responseContent = {
                                    'name': node.name,
                                    'path': node.path,
                                    'type': 'DOC',
                                    'identifier': docId
                                };
                                response.json(responseContent);
                                response.end()
                            });
                        }
                    });

            } else {
                //create a new Collection entry in the database
                new collection({
                    collectionName: node.name,
                    path: resolvedPath
                }).save(function(err, newCollection){
                        //extracts the user-name from path
                        var userName = extractUsername(path);
                        //new directory's path
                        var newDirectoryPath = resolvedPath + '\\' + node.name;

                        //make a new directory
                        mkdirp(newDirectoryPath, function(err) {
                            if (err) {
                                //errors namely permission denied
                                console.log(err.stack);
                                throw err;
                            } else {
                                if (isProject(path)) {
                                    console.log("Adding a Project");
                                    //add a entry for new Project
                                    new userProject({
                                        userID: userName,
                                        projectPath: newDirectoryPath
                                    }).save(function (err, newEntry) {
                                            var responseContent = {
                                                'name': node.name,
                                                'path': path,
                                                'type': 'COLLECTION'
                                            };
                                            //sends the newly added directory in response
                                            console.log(responseContent);
                                            response.json(responseContent);
                                            response.end();
                                        });
                                } else {
                                    var responseContent = {
                                        'name': node.name,
                                        'path': path,
                                        'type': 'COLLECTION'
                                    };
                                    //sends the newly added directory in response
                                    console.log(responseContent);
                                    response.json(responseContent);
                                    response.end();
                                }
                            }
                        });
                    });
            }
        } catch (err) {
            console.log(err.stack);
            response.end();
        }
    }

};


function getCollectionContent(path, resolvedPath, callback) {
    try {
        //reads the directory
        fs.readdir(resolvedPath, function(err, items) {
            //content holds objects containing info of directory items
            var content = [];
            if (items.length > 0) {
                items.forEach(function (item) {
                    var itemPath = resolvedPath + '\\' + item;
                    //checks if the item is a directory
                    if (fs.lstatSync(itemPath).isDirectory()) {
                        //if directory, push COLLECTION object into content
                        content.push({
                            name: item,
                            path: path,
                            type: 'COLLECTION'
                        });
                        //if all items are parsed, call the callback function
                        if (content.length == items.length) {
                            console.log(content);
                            callback(content);
                        }
                    } else {
                        var fileName = item;
                        file.find({fileName: fileName, path: path}, function (err, entries) {
                            console.log(entries);
                            if (err) {
                                //error reading database
                                console.log(err.stack);
                                throw err;
                            } else {
                                if (entries.length > 0) {
                                    entries.forEach(function (entry) {
                                        //push DOC object into content
                                        content.push({
                                            name: entry.fileName,
                                            path: path,
                                            type: 'DOC',
                                            identifier: entry.fileID
                                        });
                                        //if all items are parsed, call the callback function
                                        if (content.length == items.length) {
                                            console.log(content);
                                            callback(content);
                                        }
                                    });
                                } else {
                                    //if the entry for the doc is not found in database
                                    console.log(fileName);
                                    throw {
                                        msg: 'No matching entry for doc found'
                                    };
                                }
                            }
                        });
                    }
                });
            } else {
                callback(content);
            }
        });
    } catch (err) {
        console.log(err.stack);
        throw err;
    }
}


function resolve(path) {
    var resolvedPath = "";
    for(var i = 0; i  < path.length; ++i){
        if(path.charAt(i) == '.'){
            resolvedPath += "\\";
        } else{
            resolvedPath += path.charAt(i);
        }
    }
    return resolvedPath;
}


function extractUsername(path) {
    var username = "";
    for(var i = 1; i  < path.length; ++i){
        if(path.charAt(i) == '.'){
            break;
        }
        username += path.charAt(i);
    }
    return username;
}


function isProject(path) {
    var count = 0;
    for(var i = 0; i  < path.length; ++i){
        if(path.charAt(i) == '.'){
            count++;
        }
    }
    return (count == 1);
}
