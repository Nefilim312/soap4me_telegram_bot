"use strict"

let TelegramBot = require('node-telegram-bot-api');
let parser = require('rss-parser');
const token = '275785470:AAGe2ExDOZOrv1VJHG7UKZZDitJvRkB6_YE';
const ADMIN_ID = 43327461;
let bot = new TelegramBot(token, {
   polling: true
});

const rssURL = 'http://soap4.me/rss/my/hd/ba637fb61e0a7c1db86acb1f2120d48f/';

let soaps = [];
let lastTitle = '';

function update() {
   parser.parseURL(rssURL, function(err, parsed) {
      soaps = parsed.feed.entries;

      for (let i in soaps) {
         if (!lastTitle) {
            lastTitle = soaps[0].title;
            return;
         }

         console.log('Проверяем ', soaps[i].title);
         console.log('Последний ', lastTitle);

         if (soaps[i].title == lastTitle) {
            lastTitle = soaps[0].title;
            return;
         } else {
            console.log('Отправляем ', soaps[i].title);
            bot.sendMessage(ADMIN_ID, parseTitle(soaps[i].title), {
               parse_mode: 'HTML'
            });
         }
      }
   })
}

update()
var updater = setInterval(update, 1000 * 60 * 60);

// Matches /last
bot.onText(/\/last/, function(msg) {
   let count = parseInt(msg.text.split(' ')[1]);
   const chatId = msg.chat.id;

   count = (count >= 1 && count <= 10) ? count : 1;

   for (let i = 0; i < soaps.length && i < count; i++) {
      let text = soaps[i].title;
      bot.sendMessage(chatId, parseTitle(text), {
         parse_mode: 'HTML'
      });
   }

   setTimeout(function() {
      bot.sendMessage(chatId,
         "Чтобы просмотреть N результатов (не больше 10), используйте команду '/last N'.")
   }, 100);
});

// Any kind of message
bot.on('message', function(msg) {
   console.log(msg)
});

// Matches /update
bot.onText(/\/update/, function(msg) {
   update()
});

// Matches /restart
bot.onText(/\/restart/, function(msg) {
   const chatId = msg.chat.id;
   let time = new Date().toLocaleString();

   if (chatId === ADMIN_ID) {
      console.log(`Restart at ${time}`)
      lastTitle = '';
      update()
   }
});

bot.onText(/\/start/, function(msg) {
   const chatId = msg.chat.id;
   let userName = '%username%';

   if (msg.from.username) {
      userName = msg.from.username;
   } else {
      if (msg.from.first_name || msg.from.last_name) {
         userName = msg.from.first_name ? msg.from.first_name : '' + msg.from.last_name ?
            ` ${msg.from.last_name}` : '';
      }
   }

   bot.sendMessage(chatId, `Привет, ${userName}!`);
});

function parseTitle(title) {
   let splited = title.split(' / ');

   let name = splited[0];
   let url = name.replace(/\s/g, '_');
   let link = (`<a href="http://soap4.me/soap/${url}/">${name}</a>`)
   let seasonEpisode = (`<b>${splited[1]}</b>`);
   let other = splited[splited.length - 1];

   return (`${link} \n ${seasonEpisode} \n ${other}`)
}
