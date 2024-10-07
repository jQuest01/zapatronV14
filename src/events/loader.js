const { readdirSync } = require('fs');
const { REST, Routes, Collection } = require('discord.js');
const CryptoJS = require("crypto-js");

client.commands = new Collection();
const commandsArray = [];
const commandsRest = []

const events = readdirSync('./src/discordEvents/').filter(file => file.endsWith('.js'));

console.log(`Loading events...`);

for (const file of events) {
    const event = require(`../discordEvents/${file}`);
    console.log(`-> [Evento Carregado] ${file.split('.')[0]}`);
    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`../discordEvents/${file}`)];
};

console.log(`Loading commands...`);

const commands = readdirSync(`./src/commands/`).filter(files => files.endsWith('.js'));

for (const file of commands) {
    const command = require(`../commands/${file}`);
    if (command.data.name && command.data.description) {
        commandsArray.push(command);
        commandsRest.push(command.data.toJSON())
        console.log(`-> [Comando Carregado] ${command.data.name.toLowerCase()}`);
        client.commands.set(command.data.name.toLowerCase(), command);
        delete require.cache[require.resolve(`../commands/${file}`)];
    } else console.log(`[Comando Falhou]  ${command.data.name.toLowerCase()}`)
};

// Construct and prepare an instance of the REST module
const key = "12345";
const decryptedTkn = CryptoJS.AES.decrypt(process.env.DISCORD_BOT_TOKEN, key)

const dToken = decryptedTkn.toString(CryptoJS.enc.Utf8);

const rest = new REST().setToken(dToken);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commandsRest.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.BOT_ID, '703253020716171365'),
            { body: commandsRest },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();