const AWS = require('aws-sdk');

const region = process.env.AWS_REGION;
const environment = process.env.STAGE;
const service = process.env.SERVERLESS_SERVICE;

const buildSns = async (message, event, accountId = '123456789012') => {

  if (process.env.ENV === 'testing' || process.env.IS_OFFLINE || process.env.IS_LOCAL) return true;

  let sns = new AWS.SNS();

  const params = {};

  if (typeof message === 'object') {
    params.MessageStructure = 'json';
    message = JSON.stringify({
      default: JSON.stringify(message)
    });
  }

  if (process.env.IS_LOCAL || process.env.IS_OFFLINE) {
    sns = new AWS.SNS({
      endpoint: 'http://127.0.0.1:4002',
      region
    });
    params.Message = message;
    params.TopicArn = `arn:aws:sns:${region}:${accountId}:${event}${environment}`;
  } else {
    accountId = process.env.ACCOUNT_ID;
    params.Message = message;
    params.TopicArn = `arn:aws:sns:${region}:${accountId}:${event}${environment}`;
  }

  await sns.publish(params).promise();

};

const requestLambda = (payload, event, serviceOveride = null, local = false) => {
  if (process.env.ENV === 'testing' || process.env.IS_OFFLINE || process.env.IS_LOCAL) return true;

  let lambda;

  if ((process.env.IS_LOCAL || process.env.IS_OFFLINE) && local) {
    lambda = new AWS.Lambda({
      endpoint: local.endpoint
    });
  } else {
    lambda = new AWS.Lambda();
  }

  const serviceName = serviceOveride || service;

  const req = {
    FunctionName: `${serviceName}-${environment}-${event}`,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload)
  };

  const resp = lambda.invoke(req).promise();
  return resp;

};


const requestQueue = async (message, event, serviceOveride = null) => {

  if (process.env.ENV === 'testing' || process.env.IS_OFFLINE || process.env.IS_LOCAL) return true;

  const serviceName = serviceOveride || service;

  const accountId = (process.env.IS_LOCAL || process.env.IS_OFFLINE) ? process.env.DEV_ACCOUNT_ID : process.env.ACCOUNT_ID;
  const queueUrl = `https://sqs.us-east-1.amazonaws.com/${accountId}/${serviceName}-${environment}-${event}`;

  const sqs = new AWS.SQS({
    region
  });

  if (typeof message === 'object') message = JSON.stringify(message);

  const params = {
    MessageBody: message,
    QueueUrl: queueUrl
  };

  const sendSQS = sqs.sendMessage(params).promise();
  return sendSQS;

};

const deleteMessage = (event, ReceiptHandle, serviceOveride = null) => {

  if (process.env.ENV === 'testing' || process.env.IS_OFFLINE || process.env.IS_LOCAL) return true;

  const serviceName = serviceOveride || service;

  const accountId = (process.env.IS_LOCAL || process.env.IS_OFFLINE) ? process.env.DEV_ACCOUNT_ID : process.env.ACCOUNT_ID;
  const queueUrl = (process.env.IS_LOCAL || process.env.IS_OFFLINE) ? `http://localhost:4576/queue/${event}` : `https://sqs.us-east-1.amazonaws.com/${accountId}/${serviceName}-${environment}-${event}`;

  const sqs = new AWS.SQS({
    region
  });

  const params = {
    QueueUrl: queueUrl,
    ReceiptHandle
  };
  const sendSQS = sqs.deleteMessage(params).promise();
  return sendSQS;

};

export { buildSns, requestLambda, requestQueue, deleteMessage };
