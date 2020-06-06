
var doc_state = require('./state');
var doc_utility = require('./utility');
var operationalTransform = require('./OT');


function Session(docId, docPath) {
	this.state = new doc_state.State(docId, docPath);
	this.userCursorPos = {};
	this.userSynTime = {};
}


Session.prototype.addUser = function(userId) {
	this.userSynTime[userId] = this.state.getSynStamp();
	this.userCursorPos[userId] = 0;
};



Session.prototype.removeUser = function(userId) {
	try {
		if (userId in this.userSynTime && userId in this.userCursorPos) {
			delete this.userSynTime[userId];
			delete this.userCursorPos[userId];
		} else {
			//userId not found exception
			throw {
				msg: 'Cant remove user#' + userID + " . UserId doesn't exist."
			}; 
		}
	} catch (err) {
		console.log(err);
	}
};


Session.prototype.handlePush = function(request, response, userId) {
	//state of Doc#docId
	var state = this.state;
	var userCursorPos = this.userCursorPos;
	//bulk PUSH request received from User#userId
	var operationsRecvd = request.body;
	
	operationsRecvd.forEach( function(operation) {
		
		//transform the operation
		var transformed = operationalTransform.transform(operation, state.localOperations);
		
		//set the synTimeStamp of the transformed
		var synTimeStamp = state.getSynStamp();
		transformed.synTimeStamp = synTimeStamp;
		
		//perform the necessary editing 
		if (transformed.type == 'REPOSITION') {
			userCursorPos[userId] = transformed.position;
		} else {	
			//update transformedOperations to notify users of state-changes 
			state.transformedOperations.push(transformed);
			
			//clone and push the operation for transformation
			var cloned = JSON.parse(JSON.stringify(transformed));
			state.localOperations.push(cloned);

			//update the server state of the doc
			state.applyToRope(transformed);
			state.operationsNotSaved.push(transformed);

			doc_utility.log('PUSH', operation);
			doc_utility.log('TRANSFORMED', operation);
			doc_utility.log('STATE', state.getState());
		}
	});
};


Session.prototype.handleGet = function(request, response, userId) {
	
	var getOperation = request.body;
	var prevTimeStamp = this.userSynTime[userId];
	var currentTimeStamp = 0; 
	
	//editing done by other users since the users last pulled state from server
	var changesToSync = [];
	var size = this.state.transformedOperations.length;
	
	const GET_THRESHHOLD = 10;
	for (var i = prevTimeStamp; i < size && changesToSync.length < GET_THRESHHOLD; i++) {
		var operation = this.state.transformedOperations[i];
		changesToSync.push(operation);
		currentTimeStamp = operation.synTimeStamp + 1;
	}
	
	if (changesToSync.length > 0) {
		//send changes not yet synced
		this.userSynTime[userId] = currentTimeStamp;
		response.json(changesToSync);
	} else {
		//if no operations to be pushed, update the client about client position on doc
		var repositionOperations = [];
		for (var user in this.userCursorPos) {
			console.log(user);
			repositionOperations.push(
				{
					type: 'REPOSITION',
					username: user,
					userId: user,
					synTimeStamp: this.state.getSynStamp(), 
					position: this.userCursorPos[user]
				}
			);
		}
		response.json(repositionOperations);
	}
};


Session.prototype.cleanup = function() {
	this.state.cleanup();
};

Session.prototype.getUserCount = function() {
	var userCursorPos = this.userCursorPos;
	var count = 0;
	for (var key in userCursorPos) {
		if (userCursorPos.hasOwnProperty(key)) {
			count++;
		}
	}
	return count;
};

//Lets export
if (typeof this === 'object') this.Session = Session;
