// client.on("interactionCreate", async (interaction)
const { InteractionType, EmbedBuilder } = require('discord.js');
const { montaBotoesConfig } = require('../controller/botoesController')

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
    } else if (inter.type === InteractionType.ModalSubmit) {
        const command = client.commands.get(inter.message.interaction.commandName)
        command.execute({ inter, client })
    } else if (inter.type === InteractionType.MessageComponent) {
        const command = client.commands.get(inter.message.interaction.commandName)
        command.execute({ inter, client })
    }

    if (inter.isButton()) {
        const embed = new EmbedBuilder()
            .setTitle("Configurações")
            .setColor("#2f3136")

        if (inter.customId == 'btnDescartar') {
            embed.setDescription("Todas as alterações foram descartadas!")
            await inter.deferUpdate()
            inter.editReply({ embeds: [embed], components: [], ephemeral: true })
            setTimeout(async function () {
                //preciso bolar a ideia pra apagar essa porra
            }, 5000)

        } else if (inter.customId == 'btnSalvarCont') {
            embed.setDescription("Cuidado onde vai mexer ai o saco de vacilo, essas merda ai que me faz funcionar direito")
            await inter.deferUpdate()
            let rows = montaBotoesConfig(undefined)
            inter.editReply({ embeds: [embed], components: rows, ephemeral: true })
            salvaConfiguracoes()
        } else if (inter.customId == 'btnSalvarSair') {
            embed.setDescription("Todas as alterações foram salvas!")
            await inter.deferUpdate()
            inter.editReply({ embeds: [embed], components: [], ephemeral: true })
            setTimeout(async function () {
                //preciso bolar a ideia pra apagar essa porra
            }, 5000)
            salvaConfiguracoes()
        } else {
            embed.setDescription("Cuidado onde vai mexer ai o saco de vacilo, essas merda ai que me faz funcionar direito")
            await inter.deferUpdate()
            let rows = montaBotoesConfig(inter)
            inter.editReply({ embeds: [embed], components: rows, ephemeral: true })
        }
    }

};
