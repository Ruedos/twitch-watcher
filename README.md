


<h1 align="center">Twitch watcher</h1>
<p align="justify"> Massive thanks to Márk Zsibók this is a fork from him found at: https://github.com/D3vl0per/Twitch-watcher. I added an automatic drop collector and live checker which is inspired from https://github.com/AlexSterk/TwitchDropGrabber by Alexander Sterk massive thanks to him as well! I also added a channel points collector, a mute status check (for drops the stream has to be unmuted), the option to check if a (higher) priority streamer is available when watching a non/lower priority streamer and the ability to move on to the next priority streamer when a drop is claimed!</p>
<p align="center">
<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/D3vl0per/Valorant-watcher"> <img alt="GitHub" src="https://img.shields.io/github/repo-size/D3vl0per/Valorant-watcher"> <img alt="GitHub repo size" src="https://img.shields.io/github/license/D3vl0per/Valorant-watcher"> <img alt="GitHub issues" src="https://img.shields.io/github/issues/D3vl0per/Valorant-watcher"> <a href="https://asciinema.org/a/rob4Rh1EG4XFVfN4XWK67JSnf" target="_blank"><img src="https://asciinema.org/a/rob4Rh1EG4XFVfN4XWK67JSnf.svg" /></a>
</p>

## Features
- 🎥 True HTTP Live Streaming support (Forget the #4000 error code)
- 🔐 Cookie-based login
- 📜 Auto accept cookie policy
- 👨‍💻 The choice of a random streamer with drop-enabled tag
- 🤐 Unmuted stream
- 🛠 Detect mature content-based stream and interact with it
- 🛡 Proxy option (Not tested)
- 📽 Automatic lowest possible resolution settings
- 🧰 Highly customizable codebase
- 📦 Deployable to VPS by docker

## Requirements

 - Windows or Linux OS
 - Network connection (Should be obvious...)
 - [Nodejs](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/get-npm)
 
[//]: <> (## Installation)
[//]: <> (🎥 Tutorial video by ?? 🎥)
### Windows
1. Login to your twitch account
2. Make sure the language is set to English (or mute check won't work)!
3. Open inspector(F12 or Ctrl+Shift+I) on main site
4. Find the stored cookie section
5. Copy **auth-token**
6. Clone this repo
7. Install Chromium
8. Usually the path to the Chromium executable is: C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
9. Copy/rename .env.example to .env
10. Fix settings in the .env
11. Install the dependencies with `npm install`
12. Start the program with `npm start`
### Linux
1. Login to your twitch account
2. Make sure the language is set to English (or mute check won't work)!
3. Open inspector(F12 or Ctrl+Shift+I) on main site
4. Find the stored cookie section
5. Copy **auth-token**
6. Clone this repo
7. Install Chromium: [TUTORIAL 🤗](https://www.addictivetips.com/ubuntu-linux-tips/install-chromium-on-linux/)
8. Locate Chromium executable: `whereis chromium` or `whereis chromium-browser`
9. Copy/rename .env.example to .env
10. Fix settings in the .env
11. Install the dependencies with `npm install`
12. Start the program with `npm start`

## Docker
<p align="center">
<img alt="Docker Image Version (latest by date)" src="https://img.shields.io/docker/v/d3vm/valorant-watcher"> <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/d3vm/valorant-watcher"> <img alt="Docker Image Size (latest by date)" src="https://img.shields.io/docker/image-size/d3vm/valorant-watcher">
</p>


>Docker is a set of platform as a service (PaaS) products that uses OS-level virtualization to deliver software in packages called containers. Containers are isolated from one another and bundle their own software, libraries and configuration files. All containers are run by a single operating system kernel and therefore use fewer resources than virtual machines.
### Requirements
- [Docker](https://docs.docker.com/get-docker/)
- [Docker-Compose](https://docs.docker.com/compose/install/)

### Usage
1. Download repository
2. Copy/rename .env.example to .env
3. Fix settings in .env (executable should be something like /usr/bin/chromium-browser)
4. Run with `docker-compose up -d` command
## Dependencies
<p align="center">
<img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/D3vl0per/Valorant-watcher/puppeteer-core"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/D3vl0per/Valorant-watcher/cheerio"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/D3vl0per/Valorant-watcher/inquirer"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/D3vl0per/Valorant-watcher/dotenv"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/D3vl0per/Valorant-watcher/dayjs"> <img alt="GitHub package.json dependency version (prod)" src="https://img.shields.io/github/package-json/dependency-version/D3vl0per/valorant-watcher/tree-kill">
</p>

## .env Settings
- token = Twitch auth-token

- executable = path\to\chromium\executable

- streamersUrl = url to find streamers from, for example: https://www.twitch.tv/directory/game/Escape%20From%20Tarkov?tl=c2542d6d-cd10-4532-919b-3d19f30a768b
replace 'Escape%20From%20Tarkov' by the game the streamer should be playing, '?tl=c2542d6d-cd10-4532-919b-3d19f30a768b' makes sure to only select streamers with drops enabled tag.

- watchAlwaysTopStreamer = always select most watched streamer

- channelsWithPriority = priorities streamers above all others, seperated by ',' example: krashed,sacriel,swampfoxtv

- checkTimeout = Check every x minutes if streamer is still online and if drops have been dropped

- checkPriorityStreamersOnUpdates = check if a streamer from channelsWithPriority is found when watching streamer that is not in priority list (will check every checkTimeout minutes)

- considerPriorityOrderOnUpdates = Check if a streamer is found that comes before current streamer, based on the order of channelsWithPriority (will check every checkTimeout minutes)

- removeStreamerFromPriorityOnReward = If true streamer will be removed from priority list if a reward is found (This will not change the .env file so the removals will be reset on restart!)

- scrollDelay = Set this longer when no streamers are found (also make sure streamersUrl is correct).

- scrollTimes = Set this higher when a lot of streamers are streaming for drops, and not al are found.

- browserScreenshot = If true program should make a screenshot of the browser (Not tested this myself)

## Troubleshooting

### How does the token look like?
auth-token: `rxk38rh5qtyw95fkvm7kgfceh4mh6u`
___


### Streamers.json is empty?

Try again with higher delay.
Default delay:
```javascript
const scrollDelay = 2000;
```
[Go to code](https://github.com/Ruedos/twitch-watcher/blob/main/.env.example#L10)
___
### Something went wrong?
Try non-headless mode. Set headless value to `true`, like this:
```javascript
const showBrowser = true;
```
[Go to code](https://github.com/Ruedos/twitch-watcher/blob/main/app.js#L36)
___
### Proxy?

Yes, of course:
```javascript
const proxy = ""; // "ip:port" By https://github.com/Jan710
```
[Go to code](https://github.com/Ruedos/twitch-watcher/blob/main/.env.example#L14)  

OR

With Docker env:
```
proxy=PROXY_IP_ADDRESS:PROXY_PORT
```
___
### Screenshot without non-headless mode
```javascript
const browserScreenshot = false;
```
[Go to code](https://github.com/Ruedos/twitch-watcher/blob/main/app.js#L40)

## Donation
Show me your support by donating me a coffee <3. 

<a href="https://www.buymeacoffee.com/Ruedos" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>


## Support
 - 

## Disclaimer
This code is for educational and research purposes only.
Do not attempt to violate the law with anything contained here.
I will not be responsible for any illegal actions.
Reproduction and copy is authorised, provided the source is acknowledged.
