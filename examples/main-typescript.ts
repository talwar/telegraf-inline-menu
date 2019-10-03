import {readFileSync} from 'fs'

import Telegraf from 'telegraf'

import TelegrafInlineMenu from '../source'

const session = require('telegraf/session')

const menu = new TelegrafInlineMenu('Main Menu')

menu.urlButton('EdJoPaTo.de', 'https://edjopato.de')

let mainMenuToggle = false
menu.toggle('toggle me', 'a', {
  setFunc: (_ctx, newVal) => {
    mainMenuToggle = newVal
  },
  isSetFunc: () => mainMenuToggle
})

menu.simpleButton('click me', 'c', {
  doFunc: async ctx => ctx.answerCbQuery('you clicked me!'),
  hide: () => mainMenuToggle
})

menu.simpleButton('click me harder', 'd', {
  doFunc: async ctx => ctx.answerCbQuery('you can do better!'),
  joinLastRow: true,
  hide: () => mainMenuToggle
})

let selectedKey = 'b'
menu.select('s', ['A', 'B', 'C'], {
  setFunc: async (ctx, key) => {
    selectedKey = key
    await ctx.answerCbQuery(`you selected ${key}`)
  },
  isSetFunc: (_ctx, key) => key === selectedKey
})

const foodMenu = new TelegrafInlineMenu('People like food. What do they like?')

interface FoodChoises {
  food?: string;
  tee?: boolean;
}

const people: {[key: string]: FoodChoises} = {Mark: {}, Paul: {}}
const food = ['bread', 'cake', 'bananas']

function personButtonText(_ctx: any, key: string): string {
  const entry = people[key] as FoodChoises | undefined
  if (entry && entry.food) {
    return `${key} (${entry.food})`
  }

  return key
}

function foodSelectText(ctx: any): string {
  const person = ctx.match[1]
  const hisChoice = people[person].food
  if (!hisChoice) {
    return `${person} is still unsure what to eat.`
  }

  return `${person} likes ${hisChoice} currently.`
}

const foodSelectSubmenu = new TelegrafInlineMenu(foodSelectText)
  .toggle('Prefer Tee', 't', {
    setFunc: (ctx: any, choice) => {
      const person = ctx.match[1]
      people[person].tee = choice
    },
    isSetFunc: (ctx: any) => {
      const person = ctx.match[1]
      return people[person].tee === true
    }
  })
  .select('f', food, {
    setFunc: (ctx: any, key) => {
      const person = ctx.match[1]
      people[person].food = key
    },
    isSetFunc: (ctx: any, key) => {
      const person = ctx.match[1]
      return people[person].food === key
    }
  })

foodMenu.selectSubmenu('p', () => Object.keys(people), foodSelectSubmenu, {
  textFunc: personButtonText,
  columns: 2
})

foodMenu.question('Add person', 'add', {
  questionText: 'Who likes food too?',
  setFunc: (_ctx, key) => {
    people[key] = {}
  }
})

menu.submenu('Food menu', 'food', foodMenu, {
  hide: () => mainMenuToggle
})

let isAndroid = true
menu.submenu('Photo Menu', 'photo', new TelegrafInlineMenu('', {
  photo: () => isAndroid ? 'https://telegram.org/img/SiteAndroid.jpg' : 'https://telegram.org/img/SiteiOs.jpg'
}))
  .setCommand('photo')
  .simpleButton('Just a button', 'a', {
    doFunc: async ctx => ctx.answerCbQuery('Just a callback query answer')
  })
  .select('img', ['iOS', 'Android'], {
    isSetFunc: (_ctx, key) => key === 'Android' ? isAndroid : !isAndroid,
    setFunc: (_ctx, key) => {
      isAndroid = key === 'Android'
    }
  })

menu.setCommand('start')

const token = readFileSync('token.txt', 'utf8').trim()
const bot = new Telegraf(token)
bot.use(session())

bot.use((ctx, next) => {
  if (ctx.callbackQuery && ctx.callbackQuery.data) {
    console.log('another callbackQuery happened', ctx.callbackQuery.data.length, ctx.callbackQuery.data)
  }

  return next && next()
})

bot.use(menu.init({
  backButtonText: 'back…',
  mainMenuButtonText: 'back to main menu…'
}))

bot.catch((error: any) => {
  console.log('telegraf error', error.response, error.parameters, error.on || error)
})

bot.startPolling()
