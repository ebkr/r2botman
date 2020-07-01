const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const fetch = require("node-fetch");
const yaml = require('yaml');
const http = require('http');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    handleProfileCodeModList(msg);
});

function handleProfileCodeModList(msg) {
    const searchPosition = msg.content.toLowerCase().search(new RegExp("!profile [a-zA-Z0-9]{8,10}"));
    if (searchPosition >= 0) {
        const code = msg.content.substr(searchPosition + ("!profile ").length).match("^[^\S]+")[0];
        console.log("Code:", code)
        fetch(`https://hastebin-plus.herokuapp.com/raw/${code}`).then(value => value.text())
            .then(value => {

                if (!value.startsWith("#r2modman")) {
                    msg.reply("The code provided isn't a valid profile. Please re-export your code.");
                    return;
                }

                const buf = Buffer.from(value.substring(9).trim(), 'base64');

                new AdmZip(buf).getEntries().forEach(entry => {
                    if (entry.entryName === "export.r2x") {
                        const data = yaml.parse(entry.getData().toString());
                        const mods = new Array();
                        data.mods.forEach(mod => {
                            mods.push(`> ${mod.name}-${mod.version.major}.${mod.version.minor}.${mod.version.patch}`)
                        });
                        const modArrayDisplay = mods.join("\n");
                        msg.reply(`Here is the mod list for the provided code:\n${modArrayDisplay}`)
                    }
                });

            }).catch(reason => {
            msg.reply("Oops, there was a problem reading the code. Please try again");
            console.log(reason);
        })
    }
}

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('r2botman');
    res.end();
}).listen(process.env.PORT || 8000);

client.login(process.env.secretKey);