require('dotenv').config()
const { Client, GatewayIntentBits, Collection, Interaction, EmbedBuilder } = require("discord.js")

const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require("@distube/yt-dlp")
const { YouTubePlugin } = require('@distube/youtube')
const ffmpeg = require('ffmpeg-static')

const CryptoJS = require("crypto-js");
const { CronJob } = require('cron')
const key = "12345";

const cryptoSnd = CryptoJS.AES.decrypt(process.env.SOUNDCLOUD_CLIENT_ID, key)
const cryptoTkn = CryptoJS.AES.encrypt(process.env.SOUNDCLOUD_AUTH, key).toString()
const decryptedTkn = CryptoJS.AES.decrypt(process.env.DISCORD_BOT_TOKEN, key)

const sClient = cryptoSnd.toString(CryptoJS.enc.Utf8);
const sToken = cryptoTkn.toString(CryptoJS.enc.Utf8);
const dToken = decryptedTkn.toString(CryptoJS.enc.Utf8);

global.client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent]
})

global.distube = null

global.token = ''
global.repeat = 0
global.volume = 50
global.msgId = ''
global.jsonServer = 'https://zapas.discloud.app'

const jobToken = new CronJob('*/30 * * * *', async function () {
    const update = require('./src/controller/comandosController')['updateToken']
    update(null)
}, null, true, "America/Sao_Paulo");

const createDistube = async () => {
    const getCookies = require('./src/controller/comandosController')['getCookies']
    const cookies = await getCookies(null)

    return new DisTube(client, {
        // leaveOnEmpty: true,
        // emptyCooldown: 30,
        // leaveOnFinish: false,
        nsfw: true,
        // leaveOnStop: true,
        ffmpeg: { path: ffmpeg },
        plugins: [
            new YouTubePlugin({
                cookies
            }),
            // new SoundCloudPlugin({clientId: sClient, oauthToken: sToken}),
            new YtDlpPlugin({ update: true })
        ]
    })
}

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
    distube = await createDistube()
    require('./src/events/distube')
    require('./src/events/loader')
    console.log('Subiu', new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))
})

global.isTriviaOn = false
global.playerTrivia = []

client.login(dToken)
