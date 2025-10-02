const java = require('java');
const path = require('path');

const resourceDir = path.resolve(__dirname, '../resource/lib');
java.classpath.push(path.join (resourceDir, '/commons-io-2.4.jar'));
java.classpath.push(path.join (resourceDir, '/commons-lang3-3.3.2.jar'));
java.classpath.push(path.join (resourceDir, '/guava-18.0.jar'));
java.classpath.push(path.join (resourceDir, '/log4j-1.2-api-2.1.jar'));
java.classpath.push(path.join (resourceDir, '/log4j-api-2.1.jar'));
java.classpath.push(path.join (resourceDir, '/log4j-core-2.1.jar'));
java.classpath.push(path.join (resourceDir, '/soap-builder-1.0.0-SNAPSHOT.jar'));
java.classpath.push(path.join (resourceDir, '/soap-client-1.0.0-SNAPSHOT.jar'));
java.classpath.push(path.join (resourceDir, '/soap-common-1.0.0-SNAPSHOT.jar'));
java.classpath.push(path.join (resourceDir, '/soap-legacy-1.0.0-SNAPSHOT.jar'));
java.classpath.push(path.join (resourceDir, '/wsdl4j-1.6.3.jar'));
java.classpath.push(path.join (resourceDir, '/wsdlparse.jar'));
java.classpath.push(path.join (resourceDir, '/xmlbeans-2.3.0.jar'));
java.classpath.push(path.join (resourceDir, '/wsdlparse.jar'));

parser = function (url){
  this.jack_parser = java.newInstanceSync('com.jack.Parser',url);
	this.wsdl_parser = java.callStaticMethodSync('org.reficio.ws.builder.core.Wsdl', 'parse', url);

  this.bindings = function(){
    let list = java.callMethodSync(this.jack_parser,'getBindingNames');
    let ret = [];
    for(i=0;i<java.callMethodSync(list,'size');i++){
      ret.push( java.callMethodSync(list,'get',i) );
    }
    return ret ;
  }

  this.operations = function (binding){
    let list = java.callMethodSync(this.jack_parser,'getOperationNames',binding);
    let ret = [];
    for(i=0;i<java.callMethodSync(list,'size');i++){
      ret.push( java.callMethodSync(list,'get',i) );
    }
    return ret ;
  }

  this.sampleRequest = function(binding,operation){
    return java.callMethodSync(this.jack_parser,'getSampleRequest',binding,operation);
  }

  this.sampleResponse = function(binding,operation){
     let soap_binding = java.callMethodSync(this.wsdl_parser, 'binding');
     let m0 = java.callMethodSync(soap_binding, 'localPart', binding);
     let m1 = java.callMethodSync(m0, 'find');
     let m2 = java.callMethodSync(m1, 'operation');
     let m3 = java.callMethodSync(m2, 'name', operation);
     let soap_operation = java.callMethodSync(m3, 'find');
     return java.callMethodSync(m1,'buildOutputMessage',soap_operation);
  }

  this.soapaction = function (binding,operation){
    return java.callMethodSync(this.jack_parser,'getSoapActionName',binding,operation);
  }
	
  return this ;
}

module.exports = parser;