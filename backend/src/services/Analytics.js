const { Kafka } = require('kafkajs');

const kafkaConfig = {
    clientId: 'connect-four-analytics',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
    logLevel: 0
};

if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
    kafkaConfig.ssl = true;
    kafkaConfig.sasl = {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD
    };
}

const kafka = new Kafka(kafkaConfig);

const consumer = kafka.consumer({ groupId: 'game-analytics-group' });

const startAnalytics = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'game-events', fromBeginning: true });

        console.log('Analytics Consumer connected');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const event = JSON.parse(message.value.toString());
                if (event.type === 'GAME_END') {
                    console.log(`[ANALYTICS] Game Finished: Winner - ${event.winner}`);

                }
            },
        });
    } catch (err) {

    }
};

module.exports = startAnalytics;
