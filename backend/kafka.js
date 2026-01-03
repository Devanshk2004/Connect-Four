const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'connect-four-backend',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
    logLevel: 0 // Reduce logging noise
});

const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

const connectKafka = async () => {
    try {
        await producer.connect();
        console.log('Kafka Producer connected');
    } catch (err) {
        console.error('Kafka Producer connection error:', err.message);
    }
};

const emitGameEnd = async (gameData) => {
    try {
        await producer.send({
            topic: 'game-events',
            messages: [
                { value: JSON.stringify({ type: 'GAME_END', ...gameData, timestamp: Date.now() }) }
            ],
        });
        console.log('Game end event emitted to Kafka');
    } catch (err) {
        // Suppress errors if Kafka is not running to avoid spamming logs in dev
        // console.error('Error emitting Kafka event:', err.message);
    }
};

module.exports = { connectKafka, emitGameEnd };
