// consume-queue from aws-sdk v3 usint aws-sdk
import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
// import { logger } from "@cdp/logger";

export class ConsumeQueue {
    private sqsClient: SQSClient;
    private queueUrl: string;

    constructor(queueUrl: string) {
        this.sqsClient = new SQSClient({});
        this.queueUrl = queueUrl;
    }

    async consume() {
        try {
            const receiveParams = {
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20,
            };
            const data = await this.sqsClient.send(new ReceiveMessageCommand(receiveParams));

            if (data.Messages) {
                for (const message of data.Messages) {
                    // logger.info(`Received message: ${message.Body}`);
                    // Process the message here

                    // After processing, delete the message from the queue
                    const deleteParams = {
                        QueueUrl: this.queueUrl,
                        ReceiptHandle: message.ReceiptHandle!,
                    };
                    await this.sqsClient.send(new DeleteMessageCommand(deleteParams));
                    // logger.info(`Deleted message with ID: ${message.MessageId}`);
                }
            } else {
                // logger.info("No messages received");
            }
        } catch (error) {
            // logger.error("Error consuming messages from SQS:", error);
        }
    }
}