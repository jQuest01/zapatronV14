require('dotenv').config()
const { Client, GatewayIntentBits, Collection, Interaction, EmbedBuilder } = require("discord.js")
const { Player } = require('discord-player');

global.client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent]
})

global.player = new Player(client)

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        return
    }
    if (message.content.startsWith('-')) {
        let comando = message.content.substring(1).split(/ +/)[0]
        // if (['720766817588478054', '881559023613272064'].includes(message.channelId) || (comando === 'quiz' && message.channelId === '1093357469079715840')) {
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
        // } else {
        //     message.channel.send({ embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Comandos permitidos apenas no canal <#720766817588478054>').setColor("#FF0000")] })
        // }
    }
})

client.on('ready', async () => {
    console.log('Subiu', new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))
})

global.isTriviaOn = false
global.playerTrivia = []

require('./src/events/player')
require('./src/events/loader')

client.login(process.env.DISCORD_BOT_TOKEN)