const { readdirSync } = require('fs');
const { Collection } = require('discord.js');

client.commands = new Collection();
CommandsArray = [];

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
    if (command.name && command.description) {
        CommandsArray.push(command);
        console.log(`-> [Comando Carregado] ${command.name.toLowerCase()}`);
        client.commands.set(command.name.toLowerCase(), command);
        delete require.cache[require.resolve(`../commands/${file}`)];
    } else console.log(`[Comando Falhou]  ${command.name.toLowerCase()}`)
};

client.on('ready', (client) => {
    client.application.commands.set(CommandsArray)
})