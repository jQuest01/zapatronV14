const { EmbedBuilder } = require('discord.js');
const { montaBotoesConfig } = require('../controller/botoesController')

module.exports = {
    name: 'teste',
    description: "Exibe as configurações do meu funcionamento para caso queiram fazer alguma merda comigo",

    async execute({ inter }) {

        const embed = new EmbedBuilder()
            .setTitle("Configurações")
            .setColor("#2f3136")
            .setDescription("Cuidado onde vai mexer ai o saco de vacilo, essas merda ai que me faz funcionar direito")

        let rows = montaBotoesConfig(undefined, client)

        inter.reply({
            embeds: [embed],
            components: rows,
            ephemeral: true
        })

    },
};