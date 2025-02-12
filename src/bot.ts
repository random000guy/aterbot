import Mineflayer from 'mineflayer';
import { sleep, getRandom } from "./utils.ts";
import CONFIG from "../config.json" assert {type: 'json'};

let loop: NodeJS.Timeout;
let bot: Mineflayer.Bot;

const disconnect = (): void => {
	clearInterval(loop);  // Clear the action loop
	bot?.quit?.();
	bot?.end?.();
};

const reconnect = async (): Promise<void> => {
	console.log(`Trying to reconnect in ${CONFIG.action.retryDelay / 1000} seconds...\n`);

	disconnect();
	await sleep(CONFIG.action.retryDelay);
	createBot();
	return;
};

const createBot = (): void => {
	bot = Mineflayer.createBot({
		host: CONFIG.client.host,
		port: +CONFIG.client.port,
		username: CONFIG.client.username,
		version: "1.18"
	} as const);

	bot.once('error', error => {
		console.error(`AFKBot got an error: ${error}`);
	});
	bot.once('kicked', rawResponse => {
		console.error(`\n\nAFKbot is disconnected: ${rawResponse}`);
	});
	bot.once('end', () => void reconnect());

	bot.once('spawn', () => {
		// Function to send a message
		const sendMessage = async (): Promise<void> => {
			const message = `Hello, I'm the AFK bot!`;
			console.log(`Sending message: ${message}`);
			bot.chat(message);
			return;
		};

		// Function to disconnect the bot
		const disconnectBot = async (): Promise<void> => {
			console.log("Disconnecting bot...");
			disconnect();
		};

		// Set intervals for sending messages and disconnecting
		const messageInterval = setInterval(() => {
			sendMessage();
		}, CONFIG.action.messageInterval); // Send message at specified interval

		const disconnectInterval = setInterval(() => {
			disconnectBot();
		}, CONFIG.action.disconnectInterval); // Disconnect at specified interval

		// Clear both intervals when bot is disconnected
		bot.once('end', () => {
			clearInterval(messageInterval);
			clearInterval(disconnectInterval);
		});
	});

	bot.once('login', () => {
		console.log(`AFKBot logged in ${bot.username}\n\n`);
	});
};

export default (): void => {
	createBot();
};
