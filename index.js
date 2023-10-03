require('dotenv').config()
const { Client, GatewayIntentBits, Collection, Interaction, EmbedBuilder } = require("discord.js")

const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { SpotifyPlugin } = require('@distube/spotify');

const CryptoJS = require("crypto-js");

global.client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent]
})

global.distube = new DisTube(client, {
    searchCooldown: 30,
    leaveOnEmpty: true,
    emptyCooldown: 30,
    leaveOnFinish: false,
    nsfw: true,
    leaveOnStop: true,
    plugins: [new SoundCloudPlugin(), new SpotifyPlugin()]
})

global.jsonServer = 'https://zapas.discloud.app'

const key = "12345";
const decrypted = CryptoJS.AES.decrypt(process.env.DISCORD_BOT_TOKEN, key)

const token = decrypted.toString(CryptoJS.enc.Utf8);

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        return
    }
    if (message.content.startsWith('-')) {
        let comando = message.content.substring(1).split(/ +/)[0]
        if ((comando === 'quiz' && message.channelId === '1093357469079715840') || (['720766817588478054', '881559023613272064'].includes(message.channelId))) {
            try {
                const func = require('./src/controller/comandosController')[comando]
                const retorno = await func(message)
                if (retorno) {
                    message.channel.send({ embeds: [retorno] })
                }
            } catch (error) {
                console.log(error)
                message.channel.send({ embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Esse comando não existe').setColor("#FF0000")] })
            }
        } else {
            message.channel.send({ embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Comando não permitido no canal').setColor("#FF0000")] })
        }
    }
})

client.on('ready', async () => {
    console.log('Subiu', new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))
})

global.isTriviaOn = false
global.playerTrivia = []

require('./src/events/distube')
require('./src/events/loader')

client.login(token)
