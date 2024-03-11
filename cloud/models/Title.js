class Title extends Parse.Object {
    constructor() {
        super('Title')
    }

    static async assignUser(user, titleName) {
        const query = new Parse.Query('Title')
        query.equalTo('name', titleName)
        const title = await query.first({ useMasterKey: true })

        const relation = title.relation('users')
        relation.add(user)

        return title
    }

    static getTitleForScore(score) {
        let titleName

        if (score >= 600) {
            titleName = 'Black belt 10 dan'
        } else if (score >= 500) {
            titleName = 'Black belt 9 dan'
        } else if (score >= 450) {
            titleName = 'Black belt 8 dan'
        } else if (score >= 400) {
            titleName = 'Black belt 7 dan'
        } else if (score >= 350) {
            titleName = 'Black belt 6 dan'
        } else if (score >= 300) {
            titleName = 'Black belt 5 dan'
        } else if (score >= 250) {
            titleName = 'Black belt 4 dan'
        } else if (score >= 200) {
            titleName = 'Black belt 3 dan'
        } else if (score >= 150) {
            titleName = 'Black belt 2 dan'
        } else if (score >= 100) {
            titleName = 'Black belt 1 dan'
        } else if (score >= 90) {
            titleName = 'Brown belt III'
        } else if (score >= 80) {
            titleName = 'Brown belt II'
        } else if (score >= 70) {
            titleName = 'Brown belt I'
        } else if (score >= 60) {
            titleName = 'Blue belt II'
        } else if (score >= 50) {
            titleName = 'Blue belt I'
        } else if (score >= 40) {
            titleName = 'Green belt'
        } else if (score >= 30) {
            titleName = 'Orange belt'
        } else if (score >= 20) {
            titleName = 'Yellow belt'
        } else if (score >= 15) {
            titleName = 'White belt III'
        } else if (score >= 10) {
            titleName = 'White belt II'
        } else if (score >= 5) {
            titleName = 'White belt I'
        } else {
            titleName = 'White belt'
        }

        return titleName
    }

    static async devCreateTitles(req) {

        const names = [
            "White belt 12 kyu",
            "White belt 11 kyu",
            "White belt 10 kyu",
            "White belt 9 kyu",
            "Yellow belt 8 kyu",
            "Orange belt 7 kyu",
            "Green belt 6 kyu",
            "Blue belt 5 kyu",
            "Blue belt 4 kyu",
            "Brown belt 3 kyu",
            "Brown belt 2 kyu",
            "Brown belt 1 kyu",
            "Black belt 1 dan",
            "Black belt 2 dan",
            "Black belt 3 dan",
            "Black belt 4 dan",
            "Black belt 5 dan",
            "Black belt 6 dan",
            "Black belt 7 dan",
            "Black belt 8 dan",
            "Black belt 9 dan",
            "Black belt 10 dan"
        ]

        const titles = names.map(name => {
            const newTitle = new Title()
            newTitle.set('name', name)
            return newTitle
        })

        await Parse.Object.saveAll(titles)
    }

    static registerClass() {
        Parse.Object.registerSubclass('Title', Title)
    }
}

module.exports = Title
