const { ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs')

module.exports = {
    name: 'addsong',
    description: "Adiciona uma música na lista do trivia",
    voiceChannel: true,
    options: [
        {
            name: 'nome',
            description: 'Nome da música pra adicionar',
            type: ApplicationCommandOptionType.String,
            required: true,
        }, {
            name: 'link',
            description: 'Link da música pra adicionar',
            type: ApplicationCommandOptionType.String,
            required: true,
        }, {
            name: 'cantor',
            description: 'Cantor da música (se for mais de um, separe por virgula)',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });

        const song = inter.options.getString('nome');
        const link = inter.options.getString('link');
        const singer = []

        if (inter.options.getString('cantor').includes(',')) {
            for (const cantor of inter.options.getString('cantor').split(',')) {
                singer.push(cantor.trim())
            }
        } else {
            singer.push(inter.options.getString('cantor').trim())
        }

        const jsonSongs = JSON.parse(fs.readFileSync(
            './src/resources/songs.json',
            'utf-8'
        ))

        const result = jsonSongs.filter((s) => {
            return (s.url === link || (s.title === song && s.singers.some(r => singer.includes(r))))
        })

        if (!result.length) {
            await inter.editReply({ content: 'Adicionando sua música... 🎧' });

            jsonSongs.push({
                title: song,
                url: link,
                singers: singer
            })
            fs.writeFileSync('./src/resources/songs.json', JSON.stringify(jsonSongs))
            return await inter.editReply({ content: 'Música adicionada com sucesso' });
        }
        return await inter.editReply({ content: 'Sua música já está na lista.' });

    },
};
