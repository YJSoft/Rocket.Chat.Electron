'use strict';

var app = require('app');
var ipc = require('ipc');
var path = require('path');
var BrowserWindow = require('browser-window');
var env = require('./vendor/electron_boilerplate/env_config');
var devHelper = require('./vendor/electron_boilerplate/dev_helper');
var windowStateKeeper = require('./vendor/electron_boilerplate/window_state');

// global variable
var APP_NAME = 'Rocket.Chat';
var INDEX = 'https://rocket.chat/home';
// var INDEX = 'file://' + path.join( __dirname, 'app.html' );

// Create main window and prevent window being GC'd
let mainWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('activate-with-no-open-windows', function() {
    if (!mainWindow) {
        appReady();
    } else {
        mainWindow.show();
    }
});

var willQuit = false;

app.on('before-quit', function() {
    willQuit = true;
});

app.on('ready', appReady);

function initWindow() {
    var win = new BrowserWindow({
        "title": APP_NAME,
        "node-integration": false,
        "accept-first-mouse": true,
        "show": false,
        "x": mainWindowState.x,
        "y": mainWindowState.y,
        "width": mainWindowState.width,
        "height": mainWindowState.height,
        "preload": path.resolve(path.join(__dirname, 'preload.js')),
        "web-preferences": {
            "web-security": false
        }
    });

    if (mainWindowState.isMaximized) {
        win.maximize();
    }

    win.on('close', function(event) {
        mainWindowState.saveState(mainWindow);
        if (willQuit !== true && process.platform === 'darwin') {
            event.preventDefault();
            win.hide();
        }
    });

    if (env.name === 'development') {
        devHelper.setDevMenu();
        win.openDevTools();
    }

    return win;
}

function appReady() {

    var appWindow = initWindow();
    appWindow.hide();
    appWindow.webContents.on('did-finish-load', function() {
        //prevent flicker workaround
        mainWindow.setAlwaysOnTop(true);
        appWindow.show();
        setTimeout(function() {
            mainWindow.close();
        }, 100);
    });

    mainWindow = initWindow();

    mainWindow.loadUrl(INDEX);

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.show();
    });

    mainWindow.webContents.on('new-window', function(ev, url, target) {
        if (target == '_system') {
            ev.preventDefault();
            require('shell').openExternal(url);
        } else if (target == '_blank') {
            ev.preventDefault();
            appWindow.loadUrl(url);
        }
    });

};

// Custom function
ipc.on('message', function(event, arg) {
    console.log(arg); // prints "ping"
    event.returnValue = 'pong';
});

ipc.on('open-dev', function(event, arg) {
    mainWindow.openDevTools();
});

ipc.on('unread-changed', function(event, unread) {
    if (unread == null) {
        unread = '';
    }
    if (process.platform === 'darwin') {
        app.dock.setBadge(String(unread));
    }
});
