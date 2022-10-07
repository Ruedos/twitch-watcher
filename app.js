require('dotenv').config();
const puppeteer = require('puppeteer-core');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
var fs = require('fs');
const inquirer = require('./input');
const treekill = require('tree-kill');

var run = true;
var cookie = null;
var streamers = null;
let buffering = 0;
let prevDuration = -1;
var debug = false;
// ========================================== CONFIG SECTION =================================================================
const configPath = './config.json'
const screenshotFolder = './screenshots/';
const baseUrl = 'https://www.twitch.tv/';
const userAgent = (process.env.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
const streamersUrl = (process.env.streamersUrl || 'https://www.twitch.tv/directory/game/Escape%20From%20Tarkov?tl=c2542d6d-cd10-4532-919b-3d19f30a768b');

const scrollDelay = (Number(process.env.scrollDelay) || 2000);
const scrollTimes = (Number(process.env.scrollTimes) || 5);

const minWatching = (Number(process.env.minWatching) || 60); // Minutes
const maxWatching = (Number(process.env.maxWatching) || 300); //Minutes
const checkTimeout = (Number(process.env.checkTimeout) * 60000|| 300000); //Milliseconds

const channelsWithPriority = process.env.channelsWithPriority ? process.env.channelsWithPriority.split(",") : ['sacriel','swampfoxtv'];
const checkPriorityStreamersOnUpdates = (process.env.checkPriorityStreamersOnUpdates || true);
const considerPriorityOrderOnUpdates = (process.env.considerPriorityOrderOnUpdates || false);
const removeStreamerFromPriorityOnReward = (process.env.removeStreamerFromPriorityOnReward || false);
const watchAlwaysTopStreamer = (process.env.watchAlwaysTopStreamer || false);
var watch;

const showBrowser = false; // false state equ headless mode;
const proxy = (process.env.proxy || ""); // "ip:port" By https://github.com/Jan710
const proxyAuth = (process.env.proxyAuth || "");

const browserScreenshot = (process.env.browserScreenshot || false);

const browserClean = 1;
const browserCleanUnit = 'hour';
var browser_last_refresh = dayjs().add(browserClean, browserCleanUnit);

var path = require('path');
global.appRoot = path.resolve(__dirname);

var browserConfig = {
  headless: !showBrowser,
  args: [
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
	'--window-size=1500,950'
  ]
}; //https://github.com/D3vl0per/Valorant-watcher/issues/24

const cookiePolicyQuery = 'button[data-a-target="consent-banner-accept"]';
const matureContentQuery = 'button[data-a-target="player-overlay-mature-accept"]';
const sidebarQuery = '*[data-test-selector="user-menu__toggle"]';
const userStatusQuery = 'span[data-a-target="presence-text"]';
const channelsQuery = 'a[data-test-selector*="TitleAndChannel"]';
const streamPauseQuery = 'button[data-a-target="player-play-pause-button"]';
const streamSettingsQuery = '[data-a-target="player-settings-button"]';
const streamQualitySettingQuery = '[data-a-target="player-settings-menu-item-quality"]';
const streamQualityQuery = 'input[data-a-target="tw-radio"]';
const muteStatusQuery = 'button[data-a-target="player-mute-unmute-button"]';
const pointsQuery = 'div[data-test-selector="balance-string"]';
// ========================================== CONFIG SECTION =================================================================



async function viewRandomPage(page) {
	buffering = 0;
	prevDuration = -1;
  try {
    if (watchAlwaysTopStreamer) {
      watch = streamers[0];
    } else {
      watch = streamers[getRandomInt(0, streamers.length - 1)]; //https://github.com/D3vl0per/Valorant-watcher/issues/27
    }

    if (channelsWithPriority.length > 0 ) {
      for (let i = 0; i < channelsWithPriority.length; i++) {
        if (streamers.includes(channelsWithPriority[i])) {
          watch = channelsWithPriority[i];
          break;
        }
      }
    }

    console.log('\n📺 Streamers with priority: ' + channelsWithPriority);
    console.log('🔗 Now watching streamer: ', baseUrl + watch);

    await page.goto(baseUrl + watch, {
      "waitUntil": "networkidle0"
    }); //https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions

    await clickWhenExist(page, cookiePolicyQuery);
    await clickWhenExist(page, matureContentQuery); //Click on accept button

    console.log('🔧 Setting lowest possible resolution..');
    await clickWhenExist(page, streamPauseQuery);
    
    await clickWhenExist(page, streamSettingsQuery);
    await page.waitFor(streamQualitySettingQuery);
    
    await clickWhenExist(page, streamQualitySettingQuery);
    await page.waitFor(streamQualityQuery);
    
    var resolution = await queryOnWebsite(page, streamQualityQuery);
    resolution = resolution[resolution.length - 1].attribs.id;
    await page.evaluate((resolution) => {
      document.getElementById(resolution).click();
    }, resolution);
    
    await clickWhenExist(page, streamPauseQuery);
    
    let muteStatus = await queryOnWebsite(page, muteStatusQuery); //status jQuery
    if (muteStatus[0].attribs['aria-label'] === "Unmute (m)") {
    	await page.keyboard.press('m'); //For unmute
    	console.log('🔈 Mute status: Channel unmuted.');
    } else {
    	console.log('🔈 Mute status: Channel was already unmuted.');
    }
    //muteStatus = await queryOnWebsite(page, muteStatusQuery); //status jQuery
    
    //console.log('🔈 Mute status:', muteStatus[0] ? muteStatus[0].attribs['aria-label'] : "Unknown");


    if (browserScreenshot) {
      await page.waitFor(1000);
      fs.access(screenshotFolder, error => {
        if (error) {
          fs.promises.mkdir(screenshotFolder);
        }
      });
      await page.screenshot({
        path: `${screenshotFolder}${watch}.png`
      });
      console.log('📸 Screenshot created: ' + `${watch}.png`);
    }

    await clickWhenExist(page, sidebarQuery); //Open sidebar
    await page.waitFor(userStatusQuery); //Waiting for sidebar
    let status = await queryOnWebsite(page, userStatusQuery); //status jQuery
    await clickWhenExist(page, sidebarQuery); //Close sidebar

    console.log('💡 Account status:', status[0] ? status[0].children[0].data : "Unknown");
    console.log('🕒 Time: ' + dayjs().format('HH:mm:ss'));
    //console.log('💤 Watching stream for ' + sleep / 60000 + ' minutes\n');

    //await page.waitFor(sleep);
  } catch (e) {
    console.log('🤬 Error: ', e);
    console.log('Please visit the discord channel to receive help: https://discord.gg/s8AH4aZ');
  }
}



async function readLoginData() {
  const cookie = [{
    "domain": ".twitch.tv",
    "hostOnly": false,
    "httpOnly": false,
    "name": "auth-token",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "id": 1
  }];
  try {
    console.log('🔎 Checking config file...');

    if (fs.existsSync(configPath)) {
      console.log('✅ Json config found!');

      let configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'))

      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      browserConfig.executablePath = configFile.exec;
      cookie[0].value = configFile.token;

      return cookie;
    } else if (process.env.token) {
      console.log('✅ Env config found');

      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      cookie[0].value = process.env.token; //Set cookie from env
      browserConfig.executablePath = process.env.executable;//'/usr/bin/chromium-browser'; //For docker container

      return cookie;
    } else {
      console.log('❌ No config file found!');

      let input = await inquirer.askLogin();

      fs.writeFile(configPath, JSON.stringify(input), function(err) {
        if (err) {
          console.log(err);
        }
      });

      if (proxy) browserConfig.args[6] = '--proxy-server=' + proxy;
      browserConfig.executablePath = input.exec;
      cookie[0].value = input.token;

      return cookie;
    }
  } catch (err) {
    console.log('🤬 Error: ', e);
    console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
  }
}



async function spawnBrowser() {
  console.log("=========================");
  console.log('📱 Launching browser...');
  var browser = await puppeteer.launch(browserConfig);
  var page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768});

  console.log('🔧 Setting User-Agent...');
  await page.setUserAgent(userAgent); //Set userAgent

  console.log('🔧 Setting auth token...');
  await page.setCookie(...cookie); //Set cookie

  console.log('⏰ Setting timeouts...');
  await page.setDefaultNavigationTimeout(process.env.timeout || 0);
  await page.setDefaultTimeout(process.env.timeout || 0);

  if (proxyAuth) {
    await page.setExtraHTTPHeaders({
      'Proxy-Authorization': 'Basic ' + Buffer.from(proxyAuth).toString('base64')
    })
  }
  
  
  var inventory = await browser.newPage();
  await inventory.setViewport({width: 1366, height: 768})
  await page.bringToFront();

  return {
    browser,
    page,
    inventory
  };
}



async function getAllStreamer(page) {
  console.log("=========================");
  await page.goto(streamersUrl, {
    "waitUntil": "networkidle0"
  });
  console.log('🔐 Checking login...');
  await checkLogin(page);
  console.log('📡 Checking active streamers...');
  await scroll(page, scrollTimes);
  const jquery = await queryOnWebsite(page, channelsQuery);
  streamers = null;
  streamers = new Array();

  console.log('🧹 Filtering out html codes...');
  for (var i = 0; i < jquery.length; i++) {
    streamers[i] = jquery[i].attribs.href.split("/")[1];
  }
  return;
}



async function updateAllStreamers(browser){
  if(debug){console.log('Updating active streamers with drops tag enabled');}
  page = await browser.newPage();
  await page.goto(streamersUrl, {
    "waitUntil": "networkidle0"
  });
  await scroll(page, scrollTimes);
  const jquery = await queryOnWebsite(page, channelsQuery);
  streamers = null;
  streamers = new Array();
  for (var i = 0; i < jquery.length; i++) {
    streamers[i] = jquery[i].attribs.href.split("/")[1];
  }
  page.close();
  return;
}



async function checkLogin(page) {
  let cookieSetByServer = await page.cookies();
  for (var i = 0; i < cookieSetByServer.length; i++) {
    if (cookieSetByServer[i].name == 'twilight-user') {
      console.log('✅ Login successful!');
      return true;
    }
  }
  console.log('🛑 Login failed!');
  console.log('🔑 Invalid token!');
  console.log('\nPleas ensure that you have a valid twitch auth-token.\nhttps://github.com/D3vl0per/Valorant-watcher#how-token-does-it-look-like');
  if (!process.env.token) {
    fs.unlinkSync(configPath);
  }
  process.exit();
}



async function scroll(page, times) {
  //console.log('🔨 Emulating scrolling...');

  for (var i = 0; i < times; i++) {
    await page.evaluate(async (page) => {
      var x = document.getElementsByClassName("scrollable-trigger__wrapper");
      if (x.length > 0) { // there will be no scroll if there are no active streams
        x[0].scrollIntoView();
      }
    });
    await page.waitFor(scrollDelay);
  }
  return;
}



function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



async function clickWhenExist(page, query) {
  let result = await queryOnWebsite(page, query);

  try {
    if (result[0].type == 'tag' && result[0].name == 'button') {
      await page.click(query);
      await page.waitFor(500);
      return;
    }
  } catch (e) {}
}



async function queryOnWebsite(page, query) {
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  let $ = cheerio.load(bodyHTML);
  const jquery = $(query);
  return jquery;
}



async function cleanup(browser, page, inventory) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  await pages.map((inventory) => inventory.close());
  await treekill(browser.process().pid, 'SIGKILL');
  //await browser.close();
  return await spawnBrowser();
}



async function killBrowser(browser, page) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  treekill(browser.process().pid, 'SIGKILL');
  return;
}



async function shutDown() {
  console.log("\n👋Bye Bye👋");
  run = false;
  process.exit();
}



async function checkInventory(inventory, page) {
  await inventory.goto('https://twitch.tv/inventory', {
    waitUntil: ['networkidle2', 'domcontentloaded']
  });
  const claimButtons = (await inventory.$$('button[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]'));
  //console.log(`${claimButtons.length} claim buttons found${claimButtons.length > 0 ? '!' : '.'}`);
  for (const claimButton of claimButtons) {
		await inventory.bringToFront();
		await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🎁 Reward found! Claiming!')
    await claimButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (channelsWithPriority.includes(watch) && removeStreamerFromPriorityOnReward){
      console.log('🚫 Removing streamer from priority list.');
      for( var i = 0; i < channelsWithPriority.length; i++){ 
        if (channelsWithPriority[i] === watch){ 
          channelsWithPriority.splice(i, 1);
        }
      }
    }
  }
	await page.bringToFront();
	await new Promise(resolve => setTimeout(resolve, 1000));
}



async function checkBonusPoints(page) {
  const bonusButtons = (await page.$$('button[aria-label="Bonus claimen"]'));
  //console.log(`${bonusButtons.length} claim buttons found${bonusButtons.length > 0 ? '!' : '.'}`);
  for (const bonusButton of bonusButtons) {
    process.stdout.write('✨ Bonus points found! Claiming!')
  	var points = await queryOnWebsite(page, pointsQuery); //status jQuery
  	process.stdout.write(' Old value: ' + points.children(":first").toggleClass("ScAnimatedNumber-sc-acnd2k-0").text());
    await bonusButton.click();
  	await page.waitFor(500);
  	points = await queryOnWebsite(page, pointsQuery); //status jQuery
  	console.log('. New value is: ' + points.children(":first").toggleClass("ScAnimatedNumber-sc-acnd2k-0").text());
  }
}



async function isLive(mainPage) {
  // console.log(await mainPage.$$('a[status]'));
  const status = await mainPage.$$eval('a[status]', li => li.pop().getAttribute('status'));
	
	//const video = await mainPage.$$eval('video', videos => {videos.pop(); vid = videos.pop(); if(vid){return vid.currentTime;} return false});// return (videos.pop().currentTime);});//{hoi = 'hoi'; return (hoi)});//
	//if(video) {console.log(video);}
	
  //const oldVideoDuration = await mainPage.$$eval('video', videos => videos.pop().currentTime);
	//console.log('old video duriation: ' + oldVideoDuration);
	
  const videoDuration = await mainPage.$$eval('video:not([id])', videos => videos.pop().currentTime);
  const raid = mainPage.url().includes('?referrer=raid');
	console.info(`⏳ Video duration: ${videoDuration} seconds`);
	if (debug){
		console.log(`Current url: ${mainPage.url()}`);
		console.log(`Channel status: ${status}`);
	}
  const notLive = status !== 'live';//|| videoDuration === 0;
  return {videoDuration, notLive, raid};
}



async function checkLiveStatus(browser, mainPage) {
	updateAllStreamers(browser);
	if (debug) console.log(streamers);
  const {videoDuration, notLive, raid} = await isLive(mainPage);
	//await getAllStreamer(mainPage); //Call getAllStreamer function and refresh the list
  if (notLive || raid) {
    console.log('⛔ Channel offline.');
    console.log("\n=========================");
    console.log('🔭 Running watcher...');
    await viewRandomPage(mainPage);
    return;
  }
  if (videoDuration === prevDuration) {
    console.warn('⚠️ Stream buffering or offline. If this persists a new channel will be found next cycle.');
    if (++buffering > 1) {
      console.warn('⛔ Channel offline or stream still buffering.');
      console.log("\n=========================");
      console.log('🔭 Running watcher...');
      await viewRandomPage(mainPage);
      return;
    }
  } else {
    buffering = 0;
  }
	if (!streamers.includes(watch)){
    console.log('⛔ Channel no longer streaming for drops.');
		console.log("\n=========================");
		console.log('🔭 Running watcher...');
    await viewRandomPage(mainPage);
    return;
	}

  prevDuration = videoDuration;

  if (channelsWithPriority.length > 0 ) {
    if (!channelsWithPriority.includes(watch) && checkPriorityStreamersOnUpdates || considerPriorityOrderOnUpdates){
      var newWatch = false;
      for (let i = 0; i < channelsWithPriority.length; i++) {
        if (streamers.includes(channelsWithPriority[i])) {
          newWatch = channelsWithPriority[i];
          break;
        } 
      }
      if (newWatch && newWatch != watch){
        console.log('💹 Found better streamer!');
        console.log("\n=========================");
        console.log('🔭 Running watcher...');
        await viewRandomPage(mainPage);
      }
    }
  }
}



async function runTimer(browser, page, inventory) {
  if(debug)
	console.log(`\n[${new Date().toUTCString()}] Timer function called`);
/*if (dayjs(browser_last_refresh).isBefore(dayjs())) {
	console.log("=========================");
	var newSpawn = await cleanup(browser, page, inventory);
	browser = newSpawn.browser;
	page = newSpawn.page;
	inventory = newSpawn.inventory;
	//await getAllStreamer(page); //Call getAllStreamer function and refresh the list
	//console.log("=========================");
	//console.log('🔭 Running watcher...');
	//await viewRandomPage(page);
	browser_last_refresh = dayjs().add(browserClean, browserCleanUnit);
}*/

  await checkInventory(inventory, page);
  await checkBonusPoints(page);
  await checkLiveStatus(browser, page);
  setTimeout(runTimer, checkTimeout, browser, page, inventory);
}



async function main() {
  console.clear();
  console.log("=========================");
  cookie = await readLoginData();
  var {
    browser,
    page,
    inventory
  } = await spawnBrowser();
  await getAllStreamer(page);
  console.log("=========================");
  console.log('🔭 Running watcher...');
  await viewRandomPage(page);
  runTimer(browser, page, inventory);
};

main();

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
