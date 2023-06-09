// client.on("interactionCreate", async (interaction)
const { InteractionType, EmbedBuilder } = require('discord.js');

module.exports = (client, inter) => {
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
    } else if (inter.type === InteractionType.ModalSubmit){
        const command = client.commands.get(inter.message.interaction.commandName)
        command.execute({inter, client})
    } else if (inter.type === InteractionType.MessageComponent){
        const command = client.commands.get(inter.message.interaction.commandName)
        command.execute({inter, client})
    }
};
