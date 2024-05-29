// client.on("interactionCreate", async (interaction)
const { InteractionType, EmbedBuilder } = require('discord.js');
const { montaBotoesConfig } = require('../controller/botoesController')
const axios = require('axios')

module.exports = async (client, inter) => {
    if (inter.type === InteractionType.ApplicationCommand) {
        const command = client.commands.get(inter.commandName);
        if (!command) return inter.reply({ content: "Deu ruim", ephemeral: true, })
        if (command.voiceChannel) {
            if (!inter.member.voice.channel) return inter.reply({
                embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")],
                ephemeral: true
            })

            if (inter.guild.members.me.voice.channel && inter.member.voice.channel.id !== inter.guild.members.me.voice.channel.id) return inter.reply({
                embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Entre no mesmo chat de voz que eu').setColor("#FF0000")],
                ephemeral: true
            })
        }
        command.execute({ inter, client });
        // } else if (inter.type === InteractionType.ModalSubmit) {
        //     const comandosController = require('../controller/comandosController')[inter.customId]
        //     comandosController(inter)
        //     // const command = client.commands.get(inter.message.interaction.commandName)
        //     // command.execute({ inter, client })
    } else if (inter.type === InteractionType.MessageComponent) {
        if (inter.member.voice.channel) {
            const header = {
                'Authorization': token
            }
            const existe = await axios.get(`${jsonServer}/api/idempotencia`, { headers: header }).then((response) => response.data[0])
            if (!existe) {
                try {
                    await axios.post(`${jsonServer}/api/idempotencia`, { servico: inter.customId }, { headers: header }).then((response) => response.data)
                    const comandosController = require('../controller/comandosController')[inter.customId]
                    await comandosController(inter)
                } catch (error) {
                    console.log(error)
                } finally {
                    await axios.delete(`${jsonServer}/api/idempotencia`, { headers: header })
                }
            }
        }

        // const command = client.commands.get(inter.message.interaction ? inter.message.interaction.commandName : inter.customId)
        // command.execute({ inter, client })
    }

    if (inter.isButton()) {
        // const embed = new EmbedBuilder()
        //     .setTitle("Configurações")
        //     .setColor("#2f3136")

        // embed.setDescription("Cuidado onde vai mexer ai o saco de vacilo, essas merda ai que me faz funcionar direito")
        await inter.deferUpdate()
        if (inter.member.voice.channel) {
            const queue = distube.getQueue(inter.guildId)

            const embed = new EmbedBuilder()
                .setTitle('A música que tá tocando é essa: ')
                .setDescription(`\n[${queue.songs[0].name}](${queue.songs[0].url})`)
                .setImage(queue.songs[0].thumbnail)
                .setColor("0099ff")
                .setFooter({
                    text: `Adicionado por ${queue.songs[0].member.displayName ? queue.songs[0].member.displayName : queue.songs[0].member.username}`,
                    iconURL: queue.songs[0].user.avatarURL()
                })
            let rows = montaBotoesConfig(inter)
            client.channels.cache.get(inter.channelId).messages.edit(msgId, { components: rows, embeds: [embed] })
        }
    }

};
