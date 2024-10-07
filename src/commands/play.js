const { ApplicationCommandOptionType, SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const { play } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription("Adiciona uma música na playlist")
        .addStringOption(new SlashCommandStringOption().setName('musica').setDescription('a música pra adicionar').setRequired(true)),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });

        await inter.editReply({ content: `Adicionando... 🎧` });

        await play(inter).then(async (embed) => {
            if (embed) {
                await inter.editReply({ embeds: [embed] });
            } else {
                await inter.editReply({ content: `Adicionado com sucesso 🎧` });
            }
        })

    },
};
