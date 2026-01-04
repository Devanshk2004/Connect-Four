const { Kafka, Partitioners } = require('kafkajs');

const kafkaConfig = {
    clientId: 'connect-four-backend',
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
    }
};

module.exports = { connectKafka, emitGameEnd };
