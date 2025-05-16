require('dotenv').config()
const { Client, GatewayIntentBits, Collection, Interaction, EmbedBuilder } = require("discord.js")
const { CronJob } = require('cron')
const { Kazagumo, Plugins } = require('kazagumo')
const { Connectors } = require('shoukaku')

global.client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent]
})
const lavaPass = process.env.LAVALINK_PASSWORD

global.prevHistory = new Map()

global.token = ''
global.repeat = 0
global.volume = 50
global.msgId = ''
global.jsonServer = 'https://zapas.discloud.app'

const Nodes = [{
    name: 'lavalink',
    url: "lavalink-67hi.onrender.com",
    auth: lavaPass,
    secure: true
}]

global.manager = new Kazagumo({
    defaultSearchEngine: 'youtube',
    plugins: [new Plugins.PlayerMoved(client)],
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
}, new Connectors.DiscordJS(client), Nodes);

const jobToken = new CronJob('*/30 * * * *', async function () {
    const update = require('./src/controller/comandosController')['updateToken']
    update(null)
}, null, true, "America/Sao_Paulo");

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        return
    }
    if (message.content.startsWith('-')) {
        let comando = message.content.substring(1).split(/ +/)[0]
        if (message.guildId === '773910988927401994') {
            var func = require('./src/controller/comandosController')[comando]
        } else if ((comando === 'quiz' && message.channelId === '1093357469079715840') || (['720766817588478054', '881559023613272064'].includes(message.channelId))) {
            var func = require('./src/controller/comandosController')[comando]
        } else {
            message.channel.send({ embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Comando não permitido no canal').setColor("#FF0000")] })
        }

        try {
            const retorno = await func(message)
            if (retorno) {
                message.channel.send({ embeds: [retorno] })
            }
        } catch (error) {
            console.log(error)
            message.channel.send({ embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Esse comando não existe').setColor("#FF0000")] })
        }
    }
})

client.on('ready', async () => {
    // console.log((await client.users.fetch("499748161825275905")).displayAvatarURL())
    const update = require('./src/controller/comandosController')['updateToken']
    await update(null)
    require('./src/events/loader')
    require('./src/events/kazagumo')
    console.log('Subiu', new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))
})

global.isTriviaOn = false
global.playerTrivia = []

client.login(process.env.DISCORD_BOT_TOKEN)
