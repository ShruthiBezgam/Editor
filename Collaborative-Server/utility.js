
 
module.exports = {
	
	DEBUG: true,

	log: function(title, desc) {
		if (this.DEBUG) {
			console.log(title + ': ' + desc);
		}
	},

	
	fixEOL: function (content) {
		var newContent = '';
		//replace method isn't working so doing this manually
		for (var i = 0; i < content.length; i++) {
			if ((i+1 < content.length) && (content[i]=='\r' && content[i+1]=='\n')) {
				newContent += '\n';
				i++;
			} else {
				newContent += content[i];
			}
		}
		return newContent;
	}
}
