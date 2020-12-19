const AWS = require("aws-sdk");

// construct DynamoDB connection
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1', apiVersion: '2012-08-10' });
const tableName = "Project-ServiceCatalog";

exports.handler =  (event, context, callback) => {
    // set the scan parameters
    const params = { 
      TableName: tableName
    }
    
    // scan the table
    // a DynamoDB Scan operation reads all items in the given table
    dynamoDB.scan(params, (err, data) => {
        if (err) {
            // an error occurred
            console.log(err, null);
            callback(err, null);
        } 
        else {
            // successful response
            
            // get service list
            var services = data["Items"];
            // get random service
            var randomService = services[Math.floor(Math.random()*services.length)];
            
            var response = {
                "statusCode": 200,
                "body": {
                    serviceList: services,
                    randomService: randomService,
                },
                "headers": {
                    "Access-Control-Allow-Origin": "*",
	                "Access-Control-Allow-Credentials": true,
                },
            };
            callback(null, response);
        }
    });
};