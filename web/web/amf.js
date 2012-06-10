/*
amf.js - An AMF library in JavaScript

Copyright (c) 2010, James Ward - www.jamesward.com
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY JAMES WARD ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JAMES WARD OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of James Ward.
*/
function decodeAMF(data)
{
  var bytes = new a3d.ByteArray(data, a3d.Endian.BIG);

  //console.log(dumpHex(bytes));

  var version = bytes.readUnsignedShort();
  bytes.objectEncoding = a3d.ObjectEncoding.AMF0;

  var response = new a3d.AMFPacket();

  var remainingBytes;

  // Headers
  var headerCount = bytes.readUnsignedShort();
  for (var h = 0; h < headerCount; h++)
  {
    var headerName = bytes.readUTF();
    var mustUnderstand = bytes.readBoolean();
    bytes.readInt(); // Consume header length...

    // Handle AVM+ type marker
    if (version == a3d.ObjectEncoding.AMF3)
    {
      var typeMarker = bytes.readByte();
      if (typeMarker == a3d.Amf0Types.kAvmPlusObjectType)
        bytes.objectEncoding = a3d.ObjectEncoding.AMF3;
      else
        bytes.pos = bytes.pos - 1;
    }

    var headerValue = bytes.readObject();

   /*
     // Read off the remaining bytes to account for the reset of
     // the by-reference index on each header value
     remainingBytes = new a3d.ByteArray();
     remainingBytes.objectEncoding = bytes.objectEncoding;
     bytes.readBytes(remainingBytes, 0, bytes.length - bytes.pos);
     bytes = remainingBytes;
     remainingBytes = null;
     */
    
    var header = new a3d.AMFHeader(headerName, mustUnderstand, headerValue);
    response.headers.push(header);

    // Reset to AMF0 for next header
    bytes.objectEncoding = a3d.ObjectEncoding.AMF0;
  }

  // Message Bodies
  var messageCount = bytes.readUnsignedShort();
  for (var m = 0; m < messageCount; m++)
  {
    var targetURI = bytes.readUTF();
    var responseURI = bytes.readUTF();
    bytes.readInt(); // Consume message body length...

    // Handle AVM+ type marker
    if (version == a3d.ObjectEncoding.AMF3)
    {
      var typeMarker = bytes.readByte();
      if (typeMarker == a3d.Amf0Types.kAvmPlusObjectType)
        bytes.objectEncoding = a3d.ObjectEncoding.AMF3;
      else
        bytes.pos = bytes.pos - 1;
    }

    var messageBody = bytes.readObject();

    var message = new a3d.AMFMessage(targetURI, responseURI, messageBody);
    response.messages.push(message);

    bytes.objectEncoding = a3d.ObjectEncoding.AMF0;
  }

  return response;
}

function dumpHex(bytes)
{
  var s = "";
  var i = 0;
  var chunk = [];

  while (i < bytes.length)
  {

    if (((i % 16) == 0) && (i != 0)) 
    {
      s += writeChunk(chunk, 16) + "\n";
      chunk = [];
    }

    chunk.push(bytes.readUnsignedByte());

    i++;
  }
  s += writeChunk(chunk, 16);

  bytes.pos = 0;

  return s;
}

function writeChunk(chunk, width)
{
  var s = "";

  for (var i = 0; i < chunk.length; i++)
  {
    if (((i % 4) == 0) && (i != 0))
    {
      s += " ";
    }

    var b = chunk[i];

    var ss = b.toString(16) + " ";
    if (ss.length == 2)
    {
      ss = "0" + ss;
    }

    s += ss;
  }

  for (var i = 0; i < (width - chunk.length); i++)
  {
    s += "   ";
  }

  var j = Math.floor((width - chunk.length) / 4);
  for (var i = 0; i < j; i++)
  {
    s += " ";
  }

  s += "   ";

  for (var i = 0; i < chunk.length; i++)
  {
    var b = chunk[i];

    if ((b <= 126) && (b > 32))
    {
      var ss = String.fromCharCode(b);
      s += ss;
    }
    else
    {
      s += ".";
    }
  }

  return s;
}



/**
 * @preserve
 * Adamia 3D Engine v0.1
 * Copyright (c) 2010 Adam R. Smith
 * Licensed under the new BSD License:
 * http://www.opensource.org/licenses/bsd-license.php
 *
 * Project home: http://code.google.com/p/adamia-3d/
 *
 * Date: 01/12/2010
 */

if (typeof(a3d) == 'undefined')
{
  /** @namespace */
  a3d = {};
}

// Taken from http://ejohn.org/blog/simple-javascript-inheritance/

// Inspired by base2 and Prototype
(function()
{
  var initializing = false, fnTest = /xyz/.test(function()
  {
    xyz;
  }) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  /** @class */
  this.Class = function()
  {
  };

  // Create a new Class that inherits from this class
  Class.extend = function(prop)
  {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop)
    {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
              typeof _super[name] == "function" && fnTest.test(prop[name]) ?
              (function(name, fn)
              {
                return function()
                {
                  var tmp = this._super;

                  // Add a new ._super() method that is the same method
                  // but on the super-class
                  this._super = _super[name];

                  // The method only need to be bound temporarily, so we
                  // remove it when we're done executing
                  var ret = fn.apply(this, arguments);
                  this._super = tmp;

                  return ret;
                };
              })(name, prop[name]) :
              prop[name];
    }

    // The dummy class constructor
    function Class()
    {
      // All construction is actually done in the init method
      if (!initializing && this.init)
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();
/**
 * Enum for big or little endian.
 * @enum {number}
 */
a3d.Endian = {
  BIG: 0
  , LITTLE: 1
};

a3d.ObjectEncoding = {
  AMF0: 0
  , AMF3: 3
};

a3d.Amf0Types = {
  kNumberType:           0
  , kBooleanType:        1
  , kStringType:         2
  , kObjectType:         3
  , kMovieClipType:      4
  , kNullType:           5
  , kUndefinedType:      6
  , kReferenceType:      7
  , kECMAArrayType:      8
  , kObjectEndType:      9
  , kStrictArrayType:   10
  , kDateType:          11
  , kLongStringType:    12
  , kUnsupportedType:   13
  , kRecordsetType:     14
  , kXMLObjectType:     15
  , kTypedObjectType:   16
  , kAvmPlusObjectType: 17
};

a3d.Amf3Types = {
  kUndefinedType:    0
  , kNullType:       1
  , kFalseType:      2
  , kTrueType:       3
  , kIntegerType:    4
  , kDoubleType:     5
  , kStringType:     6
  , kXMLType:        7
  , kDateType:       8
  , kArrayType:      9
  , kObjectType:     10
  , kAvmPlusXmlType: 11
  , kByteArrayType:  12
};


a3d.AMFMessage = Class.extend({
  targetURL: ""
  , responseURI: ""
  , body: {}

  , init: function(targetURL, responseURI, body)
  {
    this.targetURL = targetURL;
    this.responseURI = responseURI;
    this.body = body;
  }
});

a3d.AMFPacket = Class.extend({
  version:  0
  , headers: []
  , messages: []

  , init: function(version)
  {
    this.version = (version !== undefined) ? version : 0;
    this.headers = [];
    this.messages = [];
  }
});

a3d.AMFHeader = Class.extend({
  name: ""
  , mustUnderstand: false
  , data: {}

  , init: function(name, mustUnderstand, data)
  {
    this.name = name;
    this.mustUnderstand = (mustUnderstand != undefined) ? mustUnderstand : false;
    this.data = data;
  }
});

/**
 * Attempt to imitate AS3's ByteArray as very high-performance javascript.
 * I aliased the functions to have shorter names, like ReadUInt32 as well as ReadUnsignedInt.
 * I used some code from http://fhtr.blogspot.com/2009/12/3d-models-and-parsing-binary-data-with.html
 * to kick-start it, but I added optimizations and support both big and little endian.
 * Note that you cannot change the endianness after construction.
 * @extends Class
 */
a3d.ByteArray = Class.extend({
  data: []
  , length: 0
  , pos: 0
  , pow: Math.pow
  , endian: a3d.Endian.BIG
  , TWOeN23: Math.pow(2, -23)
  , TWOeN52: Math.pow(2, -52)
  , objectEncoding: a3d.ObjectEncoding.AMF0
  , stringTable: []
  , objectTable: []
  , traitTable: []

  /** @constructor */
  , init: function(data, endian)
  {
    if (typeof data == "string") {
      data = data.split("").map(function(c) {
        return c.charCodeAt(0);
      });
    }

    this.data = (data !== undefined) ? data : [];
    if (endian !== undefined) this.endian = endian;
    this.length = data.length;

    this.stringTable = [];
    this.objectTable = [];
    this.traitTable = [];

    // Cache the function pointers based on endianness.
    // This avoids doing an if-statement in every function call.
    var funcExt = (endian == a3d.Endian.BIG) ? 'BE' : 'LE';
    var funcs = ['readInt32', 'readInt16', 'readUInt30','readUInt32', 'readUInt16', 'readFloat32', 'readFloat64'];
    for (var func in funcs)
    {
      this[funcs[func]] = this[funcs[func] + funcExt];
    }

    // Add redundant members that match actionscript for compatibility
    var funcMap = {readUnsignedByte: 'readByte', readUnsignedInt: 'readUInt32',
      readFloat: 'readFloat32', readDouble: 'readFloat64', readShort: 'readInt16', readUnsignedShort: 'readUInt16',
      readBoolean: 'readBool', readInt: 'readInt32'};
    for (var func in funcMap)
    {
      this[func] = this[funcMap[func]];
    }
  }

  , readByte: function()
  {
    var cc = this.data[this.pos++];
    return (cc & 0xFF);
  }

  , writeByte: function(byte)
  {
    this.data.push(byte);
  }

  , readBool: function()
  {
    return (this.data[this.pos++] & 0xFF) ? true : false;
  }

  , readUInt30BE: function()
  {
    var ch1 = readByte();
    var ch2 = readByte();
    var ch3 = readByte();
    var ch4 = readByte();

    if (ch1 >= 64)
      return undefined;

    return ch4 | (ch3 << 8) | (ch2 << 16) | (ch1 << 24);
  }

  , readUInt32BE: function()
  {
    var data = this.data, pos = (this.pos += 4) - 4;
    return  ((data[pos] & 0xFF) << 24) |
            ((data[++pos] & 0xFF) << 16) |
            ((data[++pos] & 0xFF) << 8) |
            (data[++pos] & 0xFF);
  }
  , readInt32BE: function()
  {
    var data = this.data, pos = (this.pos += 4) - 4;
    var x = ((data[pos] & 0xFF) << 24) |
            ((data[++pos] & 0xFF) << 16) |
            ((data[++pos] & 0xFF) << 8) |
            (data[++pos] & 0xFF);
    return (x >= 2147483648) ? x - 4294967296 : x;
  }

  , readUInt16BE: function()
  {
    var data = this.data, pos = (this.pos += 2) - 2;
    return  ((data[pos] & 0xFF) << 8) |
            (data[++pos] & 0xFF);
  }
  , readInt16BE: function()
  {
    var data = this.data, pos = (this.pos += 2) - 2;
    var x = ((data[pos] & 0xFF) << 8) |
            (data[++pos] & 0xFF);
    return (x >= 32768) ? x - 65536 : x;
  }

  , readFloat32BE: function()
  {
    var data = this.data, pos = (this.pos += 4) - 4;
    var b1 = data[pos] & 0xFF,
            b2 = data[++pos] & 0xFF,
            b3 = data[++pos] & 0xFF,
            b4 = data[++pos] & 0xFF;
    var sign = 1 - ((b1 >> 7) << 1);                   // sign = bit 0
    var exp = (((b1 << 1) & 0xFF) | (b2 >> 7)) - 127;  // exponent = bits 1..8
    var sig = ((b2 & 0x7F) << 16) | (b3 << 8) | b4;    // significand = bits 9..31
    if (sig == 0 && exp == -127)
      return 0.0;
    return sign * (1 + this.TWOeN23 * sig) * this.pow(2, exp);
  }

  , readFloat64BE: function()
  {
    var b1 = this.readByte();
    var b2 = this.readByte();
    var b3 = this.readByte();
    var b4 = this.readByte();
    var b5 = this.readByte();
    var b6 = this.readByte();
    var b7 = this.readByte();
    var b8 = this.readByte();

    var sign = 1 - ((b1 >> 7) << 1);									// sign = bit 0
    var exp = (((b1 << 4) & 0x7FF) | (b2 >> 4)) - 1023;					// exponent = bits 1..11

    // This crazy toString() stuff works around the fact that js ints are
    // only 32 bits and signed, giving us 31 bits to work with
    var sig = (((b2 & 0xF) << 16) | (b3 << 8) | b4).toString(2) +
            ((b5 >> 7) ? '1' : '0') +
            (((b5 & 0x7F) << 24) | (b6 << 16) | (b7 << 8) | b8).toString(2);	// significand = bits 12..63

    sig = parseInt(sig, 2);

    if (sig == 0 && exp == -1023)
			return 0.0;

		return sign*(1.0 + this.TWOeN52*sig)*this.pow(2, exp);
    /*
    var sig = (((b2 & 0xF) << 16) | (b3 << 8) | b4).toString(2) +
              (((b5 & 0xF) << 16) | (b6 << 8) | b7).toString(2) +
              (b8).toString(2);

    // should have 52 bits here
    console.log(sig.length);

    // this doesn't work   sig = parseInt(sig, 2);
    
    var newSig = 0;
    for (var i = 0; i < sig.length; i++)
    {
      var binaryPlace = this.pow(2, sig.length - i - 1);
      var binaryValue = parseInt(sig.charAt(i));
      newSig += binaryPlace * binaryValue;
    }


    if (newSig == 0 && exp == -1023)
      return 0.0;

    var mantissa = this.TWOeN52 * newSig;

    return sign * (1.0 + mantissa) * this.pow(2, exp);
    */
  }

  , readUInt29: function()
  {
    var value;

    // Each byte must be treated as unsigned
    var b = this.readByte() & 0xFF;

    if (b < 128)
      return b;

    value = (b & 0x7F) << 7;
    b = this.readByte() & 0xFF;

    if (b < 128)
      return (value | b);

    value = (value | (b & 0x7F)) << 7;
    b = this.readByte() & 0xFF;

    if (b < 128)
      return (value | b);

    value = (value | (b & 0x7F)) << 8;
    b = this.readByte() & 0xFF;

    return (value | b);
  }

  , readUInt30LE: function()
  {
    var ch1 = readByte();
    var ch2 = readByte();
    var ch3 = readByte();
    var ch4 = readByte();

    if (ch4 >= 64)
      return undefined;

    return ch1 | (ch2 << 8) | (ch3 << 16) | (ch4 << 24);
  }

  , readUInt32LE: function()
  {
    var data = this.data, pos = (this.pos += 4);
    return  ((data[--pos] & 0xFF) << 24) |
            ((data[--pos] & 0xFF) << 16) |
            ((data[--pos] & 0xFF) << 8) |
            (data[--pos] & 0xFF);
  }
  , readInt32LE: function()
  {
    var data = this.data, pos = (this.pos += 4);
    var x = ((data[--pos] & 0xFF) << 24) |
            ((data[--pos] & 0xFF) << 16) |
            ((data[--pos] & 0xFF) << 8) |
            (data[--pos] & 0xFF);
    return (x >= 2147483648) ? x - 4294967296 : x;
  }

  , readUInt16LE: function()
  {
    var data = this.data, pos = (this.pos += 2);
    return  ((data[--pos] & 0xFF) << 8) |
            (data[--pos] & 0xFF);
  }
  , readInt16LE: function()
  {
    var data = this.data, pos = (this.pos += 2);
    var x = ((data[--pos] & 0xFF) << 8) |
            (data[--pos] & 0xFF);
    return (x >= 32768) ? x - 65536 : x;
  }

  , readFloat32LE: function()
  {
    var data = this.data, pos = (this.pos += 4);
    var b1 = data[--pos] & 0xFF,
            b2 = data[--pos] & 0xFF,
            b3 = data[--pos] & 0xFF,
            b4 = data[--pos] & 0xFF;
    var sign = 1 - ((b1 >> 7) << 1);                   // sign = bit 0
    var exp = (((b1 << 1) & 0xFF) | (b2 >> 7)) - 127;  // exponent = bits 1..8
    var sig = ((b2 & 0x7F) << 16) | (b3 << 8) | b4;    // significand = bits 9..31
    if (sig == 0 && exp == -127)
      return 0.0;
    return sign * (1 + this.TWOeN23 * sig) * this.pow(2, exp);
  }

  , readFloat64LE: function()
  {
    var data = this.data, pos = (this.pos += 8);
    var b1 = data[--pos] & 0xFF,
            b2 = data[--pos] & 0xFF,
            b3 = data[--pos] & 0xFF,
            b4 = data[--pos] & 0xFF,
            b5 = data[--pos] & 0xFF,
            b6 = data[--pos] & 0xFF,
            b7 = data[--pos] & 0xFF,
            b8 = data[--pos] & 0xFF;
    var sign = 1 - ((b1 >> 7) << 1);									// sign = bit 0
    var exp = (((b1 << 4) & 0x7FF) | (b2 >> 4)) - 1023;					// exponent = bits 1..11

    // This crazy toString() stuff works around the fact that js ints are
    // only 32 bits and signed, giving us 31 bits to work with
    var sig = (((b2 & 0xF) << 16) | (b3 << 8) | b4).toString(2) +
            ((b5 >> 7) ? '1' : '0') +
            (((b5 & 0x7F) << 24) | (b6 << 16) | (b7 << 8) | b8).toString(2);	// significand = bits 12..63

    sig = parseInt(sig, 2);
    if (sig == 0 && exp == -1023)
      return 0.0;
    return sign * (1.0 + this.TWOeN52 * sig) * this.pow(2, exp);
  }

  , readDate: function()
  {
    var time_ms = this.readDouble();
    var tz_min = this.readUInt16();
    return new Date(time_ms + tz_min * 60 * 1000);
  }

  , readString: function(len)
  {
    var str = "";

    while (len > 0)
    {
      str += String.fromCharCode(this.readUnsignedByte());
      len--;
    }
    return str;
  }

  , readUTF: function()
  {
    return this.readString(this.readUnsignedShort());
  }

  , readLongUTF: function()
  {
    return this.readString(this.readUInt30());
  }

  , stringToXML: function(str)
  {
    var xmlDoc;

    if (window.DOMParser)
    {
      var parser = new DOMParser();
      xmlDoc = parser.parseFromString(str, "text/xml");
    }
    else // IE
    {
      xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = false;
      xmlDoc.loadXML(stc);
    }

    return xmlDoc;
  }

  , readXML: function()
  {
    var xml = this.readLongUTF();

    return this.stringToXML(xml);
  }

  , readStringAMF3: function()
  {
    var ref = this.readUInt29();

    if ((ref & 1) == 0) // This is a reference
      return this.stringTable[(ref >> 1)];

    var len = (ref >> 1);

    if (0 == len)
      return "";

    var str = this.readString(len);

    this.stringTable.push(str);

    return str;
  }

  , readTraits: function(ref)
  {
    var traitInfo = {};
    traitInfo.properties = [];

    if ((ref & 3) == 1)
      return this.traitTable[(ref >> 2)];

    traitInfo.externalizable = ((ref & 4) == 4);

    traitInfo.dynamic = ((ref & 8) == 8);

    traitInfo.count = (ref >> 4);
    traitInfo.className = this.readStringAMF3();

    this.traitTable.push(traitInfo);

    for (var i = 0; i < traitInfo.count; i++)
    {
      var propName = this.readStringAMF3();
      traitInfo.properties.push(propName);
    }

    return traitInfo;
  }

  , readExternalizable: function(className)
  {
    return this.readObject();
  }

  , readObject: function()
  {
    if (this.objectEncoding == a3d.ObjectEncoding.AMF0)
    {
      return this.readAMF0Object();
    }
    else if (this.objectEncoding == a3d.ObjectEncoding.AMF3)
    {
      return this.readAMF3Object();
    }
  }

  , readAMF0Object: function()
  {
    var marker = this.readByte();

    if (marker == a3d.Amf0Types.kNumberType)
    {
      return this.readDouble();
    }
    else if (marker == a3d.Amf0Types.kBooleanType)
    {
      return this.readBoolean();
    }
    else if (marker == a3d.Amf0Types.kStringType)
    {
      return this.readUTF();
    }
    else if ((marker == a3d.Amf0Types.kObjectType) || (marker == a3d.Amf0Types.kECMAArrayType))
    {
      var o = {};

      var ismixed = (marker == a3d.Amf0Types.kECMAArrayType);

      var size = null;
      if (ismixed)
        this.readUInt30();

      while (true)
      {
        var c1 = this.readByte();
        var c2 = this.readByte();
        var name = this.readString((c1 << 8) | c2);
        var k = this.readByte();
        if (k == a3d.Amf0Types.kObjectEndType)
          break;

        this.pos--;

        o[name] = this.readObject();
      }

      return o;
    }
    else if (marker == a3d.Amf0Types.kStrictArrayType)
    {
      var size = this.readInt();

      var a = [];

      for (var i = 0; i < size; ++i)
      {
        a.push(this.readObject());
      }

      return a;
    }
    else if (marker == a3d.Amf0Types.kTypedObjectType)
    {
      var o = {};

      var typeName = this.readUTF();
      
      var propertyName = this.readUTF();
      var type = this.readByte();
      while (type != kObjectEndType)
      {
        var value = this.readObject();
        o[propertyName] = value;

        propertyName = this.readUTF();
        type = this.readByte();
      }

      return o;
    }
    else if (marker == a3d.Amf0Types.kAvmPlusObjectType)
    {
      return this.readAMF3Object();
    }
    else if (marker == a3d.Amf0Types.kNullType)
    {
      return null;
    }
    else if (marker == a3d.Amf0Types.kUndefinedType)
    {
      return undefined;
    }
    else if (marker == a3d.Amf0Types.kReferenceType)
    {
      var refNum = this.readUnsignedShort();

      var value = this.objectTable[refNum];

      return value;
    }
    else if (marker == a3d.Amf0Types.kDateType)
    {
      return this.readDate();
    }
    else if (marker == a3d.Amf0Types.kLongStringType)
    {
      return this.readLongUTF();
    }
    else if (marker == a3d.Amf0Types.kXMLObjectType)
    {
      return this.readXML();
    }
  }

  , readAMF3Object: function()
  {
    var marker = this.readByte();

    if (marker == a3d.Amf3Types.kUndefinedType)
    {
      return undefined;
    }
    else if (marker == a3d.Amf3Types.kNullType)
    {
      return null;
    }
    else if (marker == a3d.Amf3Types.kFalseType)
    {
      return false;
    }
    else if (marker == a3d.Amf3Types.kTrueType)
    {
      return true;
    }
    else if (marker == a3d.Amf3Types.kIntegerType)
    {
      var i = this.readUInt29();

      return i;
    }
    else if (marker == a3d.Amf3Types.kDoubleType)
    {
      return this.readDouble();
    }
    else if (marker == a3d.Amf3Types.kStringType)
    {
      return this.readStringAMF3();
    }
    else if (marker == a3d.Amf3Types.kXMLType)
    {
      return this.readXML();
    }
    else if (marker == a3d.Amf3Types.kDateType)
    {
      var ref = this.readUInt29();

      if ((ref & 1) == 0)
        return this.objectTable[(ref >> 1)];

      var d = this.readDouble();
      var value = new Date(d);
      this.objectTable.push(value);

      return value;
    }
    else if (marker == a3d.Amf3Types.kArrayType)
    {
      var ref = this.readUInt29();

      if ((ref & 1) == 0)
        return this.objectTable[(ref >> 1)];

      var len = (ref >> 1);

      var key = this.readStringAMF3();

      if (key == "")
      {
        var a = [];

        for (var i = 0; i < len; i++)
        {
          var value = this.readObject();

          a.push(value);
        }

        return a;
      }

      // mixed array
      var result = {};

      while (key != "")
      {
        result[key] = this.readObject();
        key = this.readStringAMF3();
      }

      for (var i = 0; i < len; i++)
      {
        result[i] = this.readObject();
      }

      return result;
    }
    else if (marker == a3d.Amf3Types.kObjectType)
    {
      var o = {};

      this.objectTable.push(o);

      var ref = this.readUInt29();

      if ((ref & 1) == 0)
        return this.objectTable[(ref >> 1)];

      var ti = this.readTraits(ref);
      var className = ti.className;
      var externalizable = ti.externalizable;

      if (externalizable)
      {
        o = this.readExternalizable(className);
      }
      else
      {
        var len = ti.properties.length;

        for (var i = 0; i < len; i++)
        {
          var propName = ti.properties[i];

          var value = this.readObject();

          o[propName] = value;
        }

        if (ti.dynamic)
        {
          for (; ;)
          {
            var name = this.readStringAMF3();
            if (name == null || name.length == 0) break;

            var value = this.readObject();
            o[name] = value;
          }
        }
      }

      return o;
    }
    else if (marker == a3d.Amf3Types.kAvmPlusXmlType)
    {
      var ref = this.readUInt29();

      if ((ref & 1) == 0)
        return this.stringToXML(this.objectTable[(ref >> 1)]);

      var len = (ref >> 1);

      if (0 == len)
        return null;


      var str = this.readString(len);

      var xml = this.stringToXML(str);

      this.objectTable.push(xml);

      return xml;
    }
    else if (marker == a3d.Amf3Types.kByteArrayType)
    {
      var ref = this.readUInt29();
      if ((ref & 1) == 0)
        return this.objectTable[(ref >> 1)];

      var len = (ref >> 1);

      var ba = new a3d.ByteArray();

      this.objectTable.push(ba);

      for (var i = 0; i < len; i++)
      {
        ba.writeByte(this.readByte());
      }

      return ba;
    }

  }
});