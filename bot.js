const TeleBot = require("telebot");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TeleBot({
  token,
  usePlugins: ["askUser"]
});

const covid_api = "https://coronavirus-19-api.herokuapp.com";
let countries = [];

let startsFromStartDate = 0;
let asksFromStartDate = 0;
const dateOfStart = new Date().toLocaleString();

bot.on(["/start", "/help"], function(msg) {
  startsFromStartDate += 1;
  const chatId = msg.from.id;

  const replyMarkup = bot.keyboard([["Global"]], { resize: true });

  fetchAllCountries(chatId).then(() => {
    bot.sendMessage(
      chatId,
      `Hello 👋 Which country's coronavirus situation do you want to know about? 🧐 If you want to get the worldwide statistic just press the 'Global' button 🌎`,
      { replyMarkup, ask: "situation" }
    );
  });
});

bot.on("ask.situation", msg => {
  asksFromStartDate += 1;
  if (msg.text === '/start' || msg.text === '/help') return;
  const chatId = msg.from.id;
  const country = msg.text.trim();
  const replyMarkup = bot.keyboard([["Yes"], ["No"]], { resize: true });

  if (country.toLowerCase() === "global") {
    axios
      .get(`${covid_api}/all`)
      .then(responce => responce.data)
      .then(data => {
        bot.sendMessage(
          chatId,
          `In the world:
*${data.cases}* cases 🗺,
*${data.recovered}* recovered 💊,
*${data.deaths}* deaths ⚰.

Do you want to get information about another country?`,
          { parseMode: "Markdown", replyMarkup, ask: "next" }
        );
      })
      .catch(error => {
        bot.sendMessage(
          chatId,
          `Ooops, something went wrong 🙁 Error message is: '${error.message}'. Try again, please.`,
          { parseMode: "Markdown", ask: "situation" }
        );
      });
    return;
  }

  if (!countries.includes(country.toLowerCase()) ) {
    bot.sendMessage(
      chatId,
      `Ooops, something went wrong 🙁 Is '${country}' correct country name? It's also possible that I don't have '${country}' in my database. Try to send me another country name.`,
      { parseMode: "Markdown", ask: "situation" }
    );
    return;
  }

  axios
    .get(`${covid_api}/countries/${country.toLowerCase()}`)
    .then(responce => responce.data)
    .then(data => {
      bot.sendMessage(
        chatId,
        `In ${data.country}:
*${data.cases}* cases 🗺,
*${data.todayCases}* cases today 🆕,
*${data.recovered}* recovered 💊,
*${data.deaths}* deaths ⚰

Do you want to get information about another country?`,
        { parseMode: "Markdown", replyMarkup, ask: "next" }
      );
    })
    .catch(error => {
      bot.sendMessage(
        chatId,
        `Ooops, something went wrong 🙁 Error message is: '${error.message}'. Try again, please.`,
        { parseMode: "Markdown", ask: "situation" }
      );
    });
});

bot.on("ask.next", msg => {
  const chatId = msg.from.id;
  const replyMarkup = bot.keyboard([["/start"]], { resize: true });

  if (msg.text.toLowerCase() === 'no') {
    bot.sendMessage(
      chatId,
      `Alright 🙂 If you'll need me just type or press /start. Good bye 👋`,
      { replyMarkup }
    );
    return;
  }
  bot.sendMessage(
    chatId,
    `Alright! Send me country name and I'll send you statistics 📊`,
    { parseMode: "Markdown", ask: "situation", replyMarkup: 'hide' }
  );
})

function fetchAllCountries(chatId) {
  return axios
    .get(`${covid_api}/countries`)
    .then(responce => responce.data)
    .then(data =>
      data.map(({ country }) => countries.push(country.toLowerCase()))
    )
    .catch(() => {
      bot.sendMessage(
        chatId,
        `Ooops, it looks like there is some problems with server 🙁 Try to reboot bot.`
      );
      throw new Error();
    });
}

bot.on("/89214395787", msg => {
  const chatId = msg.from.id;
  bot.sendMessage(
    chatId,
    `Starting from ${dateOfStart} bot was started ${startsFromStartDate} and asked ${asksFromStartDate} times`
  );
})

bot.start();