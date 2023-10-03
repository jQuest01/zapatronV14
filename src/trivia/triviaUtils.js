function existe(arr, obj) {
    const index = arr.findIndex((e) => { return e.url === obj.url })
    if (index === -1) return null
    return arr[index]
}

module.exports = {

    atualizaTriviaPlayer(id, pontos) {
        const index = playerTrivia.findIndex((e) => { return e.id === id })

        playerTrivia[index].points = pontos

        return playerTrivia[index]
    },

    getTriviaPlayer(id) {
        const index = playerTrivia.findIndex((e) => { return e.id === id })

        if (index === -1) {
            return null
        }
        return playerTrivia[index]
    },

    getRandom(arr, n) {
        let result = []
        const len = arr.length

        if (n > len)
            throw new RangeError('getRandom: more elements taken than available!');
        while (n--) {
            let x = Math.floor(Math.random() * len);

            if (existe(result, arr[x])) {
                while (existe(result, arr[x])) {
                    x = Math.floor(Math.random() * len);
                }
            }

            result.push(arr[x].url)

        }
        return result;
    },

    normalizeValue(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove diacritics
            .replace(/[^0-9a-zA-Z\s]/g, '') // remove non-alphanumeric characters
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase(); // remove duplicate spaces
    },

    capitalizeWords(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
        });
    },

    getLeaderBoard(arr) {
        if (!arr) return '';
        if (!arr[0]) return ''; // issue #422
        let leaderBoard = '';

        leaderBoard += `👑   **<@${arr[0].id}>:** ${arr[0].points}  pontos`;

        if (arr.length > 1) {
            for (let i = 1; i < arr.length; i++) {
                leaderBoard =
                    leaderBoard + `\n\n   ${i + 1}º - <@${arr[i].id}>: ${arr[i].points}  pontos`;
            }
        }
        return leaderBoard;
    },
} 