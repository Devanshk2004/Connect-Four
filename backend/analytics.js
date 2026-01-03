const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'connect-four-analytics',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
    logLevel: 0
});

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
                    // Here we would effectively store/agg metrics
                }
            },
        });
    } catch (err) {
        // Suppress errors if Kafka is missing
    }
};

startAnalytics();
