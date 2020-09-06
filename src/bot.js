const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const fetch = require("node-fetch");
const yaml = require('yaml');
const http = require('http');
require('dotenv').config();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    router(msg);
});

function router(msg) {
    const definitions = {
        r2botman: handleR2botmanCommand,
        profile: handleProfileCodeModList
    }
    const keys = Object.keys(definitions);
    for (let i=0; i < keys.length; i++) {
        if (msg.content.toLowerCase().search(`!${keys[i]}`) >= 0) {
            definitions[keys[i]](msg);
            break;
        }
    }
}

function handleProfileCodeModList(msg) {
    const searchPosition = msg.content.toLowerCase().search(new RegExp("!profile [a-zA-Z0-9]+"));
    if (searchPosition >= 0) {
        const code = msg.content.substr(searchPosition + ("!profile ").length).match(new RegExp("[a-zA-Z0-9]+"))[0];
        fetch(`https://r2modman-hastebin.herokuapp.com/raw/${code}`).then(value => value.text())
            .then(value => {

                if (!value.startsWith("#r2modman")) {
                    msg.reply(`The code provided isn't a valid profile. Please re-export your code.`);
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
                        const messageOutput = `Here is the mod list for the provided code:\n${modArrayDisplay}`;
                        if (messageOutput.length > 2000) {
                            fetch("https://r2modman-hastebin.herokuapp.com/documents", {
                                method: "POST",
                                body: modArrayDisplay
                            }).then(resp => resp.json())
                                .then(resp => {
                                    const url = `https://r2modman-hastebin.herokuapp.com/${resp.key}`;
                                    msg.reply(`Here is the mod list for the provided code:\n${url}`)
                                });
                        } else {
                            msg.reply(`Here is the mod list for the provided code:\n${modArrayDisplay}`)
                        }
                    }
                });

            }).catch(reason => {
            msg.reply("Oops, there was a problem reading the code. Please try again");
            console.log(reason);
        })
    }
}

function handleR2botmanCommand(msg) {
    msg.reply(
        "You can use the command `!profile [code]` to retrieve a list of mods from an exported profile code." +
        "\n" +
        "To export your r2modman profile as a code:" +
        "\n• Navigate to the manager settings." +
        "\n• Find and click the `Export profile as code` setting");
}

client.login(process.env.secretKey);