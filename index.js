require('dotenv').config();
const fs=require('fs');
// === Module imports ===
const { Mwn } = require('mwn');
//const { template } = require('mwn/build/static_utils');
//console.log(Mwn)
const already=fs.readFileSync('./already.txt').toString().split('\n').map((item)=>{
    return item.replace('\r', '')

});
console.log(already)
const getpage=async(bot)=>{
    let need= await bot.read('Utilisateur:OrlodrimBot/Articles_sans_catégories_visibles')
  //  console.log(need)
    let text=need.revisions[0].slots.main.content
    let lines=text.split('\n')
    let i=0
    let need2=[]
    for (let line of lines){
        if (line.startsWith('*[[')){
            if (already.includes(line.replace('*[[', '').replace(']]', ''))){
              console.log(line.replace('*[[', '').replace(']]', ''))
                continue
            }
            need2.push(line.replace('*[[','').replace(']]',''))
        }
    }
    return need2
}
getpagecontent=async(bot, page)=>{
    let text=await bot.read(page).then((page)=>{
        return page.revisions[0].slots.main.content
    })
    let wkt = new bot.Wikitext(text)
   // console.log(wkt)
    let sections = wkt.parseLinks()
    console.log(wkt.categories)
    return {text,categories:wkt.categories,template:wkt.parseTemplates().map((item)=>{
      return item.name
    })}
}
const bot = new Mwn({
    apiUrl: 'https://fr.wikipedia.org/w/api.php',
    username: process.env.WIKI_BOTUSER,
    password: process.env.WIKI_BOTPASS,
    defaultParams: {  },
    silent: false,
    maxRetries: 3,
    retryInterval: 1000,
    userAgent: 'categorie-bot',
    logger: function (level, message) {
        console.log(level + ': ' + message);
    }
});
let date = new Date();
let month = date.toLocaleString('default', { month: 'long' });
let year = date.getFullYear();
bot.login().then(() => {
    console.log('Bot logged in');
    getpage(bot).catch((err) => {
        console.log(err);
    }).then((page) => {
      //  console.log(page);
        getpagecontent(bot, page[0]).then((text) => {
            console.log(text.template);
            if(text.template.includes('À catégoriser')){
                console.log('already has category')
                return
            }
            if(text.categories.length==0){
                console.log('no categories')
              
                bot.save('Utilisateur:Arbinger_bot/'+page[0], 
                     '{{À catégoriser|date='+month+' '+year+'}}\n' + text.text
                 ,'ajout du bandeau page non catégorisé').then((res) => {
                    console.log(res);
                }).catch((err) => {
                    console.log(err);
                });
            }
           // fs.writeFileSync(page[0]+'test.txt', text.text);
        });
        fs.appendFileSync('./already.txt', page[0]+'\n');
    });
}).catch((err) => {
    console.log(err);
});