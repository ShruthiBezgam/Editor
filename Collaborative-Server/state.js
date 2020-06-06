var fs = require('fs');


var rope = require('./rope');
var doc_utility = require('./utility');


function State (docId, docPath) {
	this.docId = docId;
	this.docPath = docPath;
	
	//initialize necessary data-structures
	this.transformedOperations = [];
	this.localOperations = [];
	this.operationsNotSaved = [];

	//fixes \r\n issue in windows
	var fileContent = doc_utility.fixEOL(fs.readFileSync(docPath).toString());

	//initialize the docState
	this.docState = rope(fileContent);
	
	// write state to the file every 2 minute interval
	var THRESHOLD_TIME_MILLISECONDS = 12000; 
	//create an Interval-Object	
	var self = this;
	this.interval = setInterval(
		function(docPath, docState) {
			//console.log(docPath, docState);
			fs.writeFile(docPath, docState, function(err) {
				if(err) {console.log(err);}
			});
			self.operationsNotSaved = []; // clears operationsNotSaved
		}, THRESHOLD_TIME_MILLISECONDS, this.docPath, this.docState
	);
}


State.prototype.getSynStamp = function() {
	return this.transformedOperations.length; 
};


State.prototype.getState = function() {
	return this.docState.toString();
};


State.prototype.applyToRope = function(operation) {
	if (operation.type == 'INSERT') {
		if (operation.position < 0 || operation.position > this.docState.length) {
			console.log('Invalid Insert Operation at ' + operation.position + ' ' + operation.charToInsert);
		} else {
			this.docState.insert(operation.position, operation.charToInsert);
		}
	} else if (operation.type == 'ERASE'){
		if (operation.position < 0 || operation.position >= this.docState.length) {
			console.log('Invalid Erase Operation at ' + operation.position);
		} else {
			this.docState.remove(operation.position, operation.position+1);
		}
	} else {
		console.log('Operation is undefined');
	}
};


State.prototype.cleanup = function() {
	clearInterval(this.interval);

	//write docState to the file Doc#docId
	fs.writeFile(this.docPath, this.docState, function(err) {
		if(err != undefined) {
			console.log(err);
		}
	});
	//stops the write-callback from execution
	doc_utility.log("Clean-up Status", 'done');
};

//Lets export
if (typeof this === 'object') this.State = State;
