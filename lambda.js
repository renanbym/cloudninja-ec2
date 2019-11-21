// Dependencias
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
var express = require('express'); 
var app = express();

var bodyParser = require('body-parser');

// Parsear o conteudo
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  	extended: true
}));


// Configuração da requisição, cabeçalhos, etc. CORS
app.use(function(req, res, next) {
  	res.header("Access-Control-Allow-Origin", "*");
  	// Métodos que queremos permitir
  	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	next();
});

// GET
app.get('/',function(req,res){

// const QueueUrl = `https://sqs.us-west-2.amazonaws.com/360053221989/EnvioDeEmail`;
const QueueUrl = `https://sqs.us-west-2.amazonaws.com/360053221989/FilaExemplo`;

const message = [
    'renanmariano@ymail.com',
    'renanbym@gmail.com'
]

  
const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: QueueUrl
};


sqs.sendMessage(params).promise().then(data => {
    console.log(data)
}).catch(err => {
    console.log(err)
})

const receiveParams = {
    AttributeNames: [
        "SentTimestamp"
    ],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: [
        "All"
    ],
    QueueUrl,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 0
};

sqs.receiveMessage(receiveParams, function (err, data) {
    if (err) {
        console.log("Receive Error", err);
    } else if (data.Messages) {
        var deleteParams = {
            QueueUrl,
            ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        console.log(data.Messages)
        
         var returnS3 = function(result){
          result = JSON.stringify(data.Messages);

          var body = '<html>'
            +'	<head>'
            +'	<meta http-equiv="Content-Type" content="text/html" charset="UTF-8"/>'
            +'	</head>'
            +'	<body>'
            +	result
            +'	</body>'
              +'</html>';
          console.log(result);
          res.writeHead(200,{"Content-Type" : "text/html"});
          res.write(body);
          res.end();
        }

        // sqs.deleteMessage(deleteParams, function (err, data) {
        //     if (err) {
        //         console.log("Delete Error", err);
        //     } else {
        //         console.log("Message Deleted", data);
        //     }
        // });
    }
});

	

 
	
});

app.listen(8080,function(){
	console.log("Conectado e escutando na porta 8080");
});
