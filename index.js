require('dotenv').config()
const { Client, GatewayIntentBits, Collection, Interaction, EmbedBuilder } = require("discord.js")

const { Player } = require('discord-player');
const { YoutubeiExtractor } = require("discord-player-youtubei")
const { SpotifyExtractor, SoundCloudExtractor } = require('@discord-player/extractor');
// const ffmpeg = require('ffmpeg-static')
const CryptoJS = require("crypto-js");
const { CronJob } = require('cron')
const key = "12345";

const decryptedTkn = CryptoJS.AES.decrypt(process.env.DISCORD_BOT_TOKEN, key)
const dToken = decryptedTkn.toString(CryptoJS.enc.Utf8);

global.client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent]
})

global.player = null

global.token = ''
global.repeat = 0
global.volume = 50
global.msgId = ''
global.jsonServer = 'https://zapas.discloud.app'

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
    const update = require('./src/controller/comandosController')['updateToken']
    await update(null)
    player = new Player(client)
    await player.extractors.register(YoutubeiExtractor)
    await player.extractors.register(SpotifyExtractor)
    await player.extractors.register(SoundCloudExtractor)

    require('./src/events/player')
    require('./src/events/loader')
    console.log('Subiu', new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))
})

global.isTriviaOn = false
global.playerTrivia = []

client.login(dToken)
