

function Rope(str) {
  // allow usage without `new`
  if (!(this instanceof Rope)) return new Rope(str);

  this._value = str;
  this.length = str.length;
  adjust.call(this);
}



Rope.SPLIT_LENGTH = 1000;



Rope.JOIN_LENGTH = 500;



Rope.REBALANCE_RATIO = 1.2;



function adjust() {
  if (typeof this._value != 'undefined') {
    if (this.length > Rope.SPLIT_LENGTH) {
      var divide = Math.floor(this.length / 2);
      this._left = new Rope(this._value.substring(0, divide));
      this._right = new Rope(this._value.substring(divide));
      delete this._value;
    }
  } else {
    if (this.length < Rope.JOIN_LENGTH) {
      this._value = this._left.toString() + this._right.toString();
      delete this._left;
      delete this._right;
    }
  }
}



Rope.prototype.toString = function() {
  if (typeof this._value != 'undefined') {
    return this._value;
  } else {
    return this._left.toString() + this._right.toString();
  }
}



Rope.prototype.remove = function(start, end) {
  if (start < 0 || start > this.length) throw new RangeError('Start is not within rope bounds.');
  if (end < 0 || end > this.length) throw new RangexError('End is not within rope bounds.');
  if (start > end) throw new RangexError('Start is greater than end.');
  if (typeof this._value != 'undefined') {
    this._value = this._value.substring(0, start) + this._value.substring(end);
    this.length = this._value.length;
  } else {
    var leftLength = this._left.length;
    var leftStart = Math.min(start, leftLength);
    var leftEnd = Math.min(end, leftLength);
    var rightLength = this._right.length;
    var rightStart = Math.max(0, Math.min(start - leftLength, rightLength));
    var rightEnd = Math.max(0, Math.min(end - leftLength, rightLength));
    if (leftStart < leftLength) {
      this._left.remove(leftStart, leftEnd);
    }
    if (rightEnd > 0) {
      this._right.remove(rightStart, rightEnd);
    }
    this.length = this._left.length + this._right.length;
  }
  adjust.call(this);
}



Rope.prototype.insert = function(position, value) {
  if (typeof value != 'string') {
    value = value.toString();
  }
  if (position < 0 || position > this.length) throw new RangeError('position is not within rope bounds.');
  if (typeof this._value != 'undefined') {
    this._value = this._value.substring(0, position) + value.toString() + this._value.substring(position);
    this.length = this._value.length;
  } else {
    var leftLength = this._left.length;
    if (position < leftLength) {
      this._left.insert(position, value);
      this.length = this._left.length + this._right.length;
    } else {
      this._right.insert(position - leftLength, value);
    }
  }
  adjust.call(this);
}


Rope.prototype.rebuild = function() {
  if (typeof this._value == 'undefined') {
    this._value = this._left.toString() + this._right.toString();
    delete this._left;
    delete this._right;
    adjust.call(this);
  }
}


Rope.prototype.rebalance = function() {
  if (typeof this._value == 'undefined') {
    if (this._left.length / this._right.length > Rope.REBALANCE_RATIO ||
        this._right.length / this._left.length > Rope.REBALANCE_RATIO) {
      this.rebuild();
    } else {
      this._left.rebalance();
      this._right.rebalance();
    }
  }
}



Rope.prototype.substring = function(start, end) {
  if (typeof end == 'undefined') {
    end = this.length;
  }
  if (start < 0 || isNaN(start)) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }
  if (end < 0 || isNaN(end)) {
    end = 0;
  } else if (end > this.length) {
    end = this.length;
  }
  if (typeof this._value != 'undefined') {
    return this._value.substring(start, end);
  } else {
    var leftLength = this._left.length;
    var leftStart = Math.min(start, leftLength);
    var leftEnd = Math.min(end, leftLength);
    var rightLength = this._right.length;
    var rightStart = Math.max(0, Math.min(start - leftLength, rightLength));
    var rightEnd = Math.max(0, Math.min(end - leftLength, rightLength));

    if (leftStart != leftEnd) {
      if (rightStart != rightEnd) {
        return this._left.substring(leftStart, leftEnd) + this._right.substring(rightStart, rightEnd);
      } else {
        return this._left.substring(leftStart, leftEnd);
      }
    } else {
      if (rightStart != rightEnd) {      
        return this._right.substring(rightStart, rightEnd);
      } else {
        return '';
      }
    }
  }
}



Rope.prototype.substr = function(start, length) {
  var end;
  if (start < 0) {
    start = this.length + start;
    if (start < 0) {
      start = 0;
    }
  }
  if (typeof length == 'undefined') {
    end = this.length;
  } else {
    if (length < 0) {
      length = 0;
    }
    end = start + length;
  }
  return this.substring(start, end);
}



Rope.prototype.charAt = function(position) {
  return this.substring(position, position + 1);
}



Rope.prototype.charCodeAt = function(position) {
  return this.substring(position, position + 1).charCodeAt(0);
}

module.exports = Rope;
