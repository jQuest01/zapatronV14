const { ApplicationCommandOptionType, SlashCommandStringOption, SlashCommandBuilder } = require('discord.js');
const { ps } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plays')
        .setDescription("Adiciona um array de músicas na playlist")
        .addStringOption(new SlashCommandStringOption().setName('musicas').setDescription('as músicas para adicionar, separe por vírgula').setRequired(true)),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });

        await inter.editReply({ content: `Adicionando suas músicas... 🎧` });

        await ps(inter).then(async (embed) => {
            if (embed) {
                await inter.editReply({ embeds: [embed] });
            } else {
                await inter.editReply({ content: `Músicas adicionadas com sucesso 🎧` });
            }
        })

    },
};
