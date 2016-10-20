import { app, BrowserWindow, Menu, crashReporter, shell, ipcMain, dialog } from "electron";
import fs from "fs";

let menu;
let template;
let mainWindow = null;
let presWindow = null;
let pdfWindow = null;
let screencapWindow = null;
let hidden = false;
let promptToSave = false;

app.commandLine.appendSwitch("--ignore-certificate-errors");

const handleRedirect = (webContents, e, url) => {
  if (url !== webContents.getURL()) {
    e.preventDefault();
    shell.openExternal(url);
  }
};

const handleSocialAuth = (socialUrl) => {
  const socialLoginWindow = new BrowserWindow({
    show: true,
    width: 1000,
    height: 700,
    // This is required for FB OAuth
    webPreferences: {
      // fails without this because of CommonJS script detection
      nodeIntegration: false,
      // required for Facebook active ping thingy
      webSecurity: false,
      plugins: true
    }
  });

  // socialLoginWindow.openDevTools();
  socialLoginWindow.loadURL(socialUrl);

  socialLoginWindow.on("close", () => {
    mainWindow.webContents.session.cookies.get({
      // name: "csrftoken",
      domain: "plot.ly"
    }, (err, cookies) => {
      // TODO: For some reason, this is always set, even on fail, wtf?
      if (Array.isArray(cookies) && cookies[0] && cookies[0].value) {
        mainWindow.webContents.send("social-login", cookies);
      }
    });
  });
};

crashReporter.start();

if (process.env.NODE_ENV === "development") {
  require("electron-debug")();
}

app.on("window-all-closed", () => {
  pdfWindow = null;
  screencapWindow = null;

  if (process.platform !== "darwin") app.quit();
});

const exportToPDF = () => {
  pdfWindow.webContents.printToPDF({
    landscape: true,
    printBackground: true,
    marginsType: 1
  }, (err, data) => {
    if (err) {
      console.log(err);

      return;
    }

    dialog.showSaveDialog({
      filters: [{
        name: "pdf",
        extensions: ["pdf"]
      }]
    }, (fileName) => {
      if (!fileName) {
        return;
      }

      const normalizedName = fileName.substr(-4) === ".pdf" ? fileName : `${fileName}.pdf`;

      fs.writeFile(normalizedName, data, (fileErr) => {
        if (fileErr) {
          console.log(fileErr);
        }
      });
    });
  });
};

const playSlideShow = () => {
  if (presWindow) {
    presWindow.focus();

    return;
  }

  presWindow = new BrowserWindow({
    show: false,
    width: 1000,
    height: 700
  });

  presWindow.loadURL(`file://${__dirname}/presentation.html`);

  presWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("trigger-update");
    presWindow.show();
    presWindow.focus();
  });

  presWindow.on("closed", () => {
    presWindow = null;
  });

  presWindow.webContents.on("will-navigate", handleRedirect.bind(null, presWindow.webContents));
  presWindow.webContents.on("new-window", handleRedirect.bind(null, presWindow.webContents));
};


app.on("ready", () => {
  screencapWindow = new BrowserWindow({
    show: false,
    width: 250,
    height: 175,
    enableLargerThanScreen: true,
    webPreferences: {
      partition: "screenCap"
    }
  });

  screencapWindow.loadURL(`file://${__dirname}/slide-preview.html#/?export`);

  ipcMain.on("ready-to-screencap", (event, data) => {
    const { currentSlideIndex, numberOfSlides } = data;

    screencapWindow.setSize(250, numberOfSlides * 175, false);

    screencapWindow.capturePage({
      x: 0,
      y: 175 * currentSlideIndex,
      width: 250,
      height: 175
    }, (image) => {
      mainWindow.webContents.send("slide-preview-image", {
        image: new Buffer(image.toPng()).toString("base64"),
        slideIndex: currentSlideIndex
      });
    });
  });

  pdfWindow = new BrowserWindow({
    show: false,
    width: 1000,
    height: 700,
    webPreferences: {
      partition: "pdf"
    }
  });

  pdfWindow.loadURL(`file://${__dirname}/presentation.html#/?export`);

  mainWindow = new BrowserWindow({
    show: false,
    width: 1600,
    height: 1000
  });

  app.on("activate", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  app.on("before-quit", () => {
    hidden = true;
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on("will-navigate", handleRedirect.bind(null, mainWindow.webContents));
  mainWindow.webContents.on("new-window", handleRedirect.bind(null, mainWindow.webContents));

  mainWindow.on("close", (ev) => {
    if (promptToSave) {
      ev.preventDefault();

      const platform = process.platform;
      let buttons = ["Save", "Don't Save", "Cancel"];

      if (platform === "darwin") {
        buttons = ["Save", "Cancel", "Don't Save"];
      }

      dialog.showMessageBox({
        type: "question",
        buttons,
        message: "Do you wish to save your project before quitting?"
      }, (response) => {
        if (response === 0) {
          mainWindow.webContents.send("file", "save");
        } else if (platform === "darwin" ? response === 2 : response === 1) {
          promptToSave = false;

          if (hidden) {
            app.quit();
          } else {
            mainWindow.close();
          }
        }
      });

      return false;
    }

    if (process.platform === "darwin" && !hidden) {
      hidden = true;
      mainWindow.hide();
      ev.preventDefault();
    }
  });

  mainWindow.on("show", () => {
    hidden = false;
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    presWindow = null;
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.openDevTools();
  }

  ipcMain.on("encode-image", (event, imagePath) => {
    fs.readFile(imagePath, (err, imageData) => {
      if (err) {
        mainWindow.webContents.send("image-encoded", null);

        return;
      }

      mainWindow.webContents.send("image-encoded", new Buffer(imageData).toString("base64"));
    });
  });

  ipcMain.on("current-element", (event, isCurrentElement) => {
    const stripMenuItemsAmpersand = (string) => string.replace(/^&/, "");
    menu.items.forEach((item, i) => {
      if (stripMenuItemsAmpersand(item.label) === "Edit") {
        item.submenu.items.forEach((option, k) => {
          const label = stripMenuItemsAmpersand(option.label);
          if (
            label === "Move Forward" ||
            label === "Move Backward" ||
            label === "Move To Front" ||
            label === "Move To Back" ||
            label === "Delete Element"
          ) {
            menu.items[i].submenu.items[k].enabled = isCurrentElement;
          }
        });
      }
    });
  });

  ipcMain.on("dirty-state-changed", (event, saveRequired) => {
    promptToSave = saveRequired;
  });

  ipcMain.on("social-login", (event, socialUrl) => {
    mainWindow.webContents.session.clearStorageData(() => {});
    // Reset the csrftoken cookie if there is one
    mainWindow.webContents.session.cookies.remove("https://plot.ly", "csrftoken", () => {
      handleSocialAuth(socialUrl);
    });
  });

  ipcMain.on("open-external", (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on("update-presentation", (event, data) => {
    screencapWindow.webContents.send("update", data);
    pdfWindow.webContents.send("update", data);

    if (presWindow) {
      presWindow.webContents.send("update", data);
    }
  });

  if (process.platform === "darwin") {
    template = [{
      label: "Electron",
      submenu: [{
        label: "About Spectacle Editor",
        selector: "orderFrontStandardAboutPanel:"
      }, {
        type: "separator"
      }, {
        label: "Services",
        submenu: []
      }, {
        type: "separator"
      }, {
        label: "Hide Spectacle Editor",
        accelerator: "Command+H",
        selector: "hide:"
      }, {
        label: "Hide Others",
        accelerator: "Command+Shift+H",
        selector: "hideOtherApplications:"
      }, {
        label: "Show All",
        selector: "unhideAllApplications:"
      }, {
        type: "separator"
      }, {
        label: "Quit",
        accelerator: "Command+Q",
        click() {
          app.quit();
        }
      }]
    }, {
      label: "File",
      submenu: [{
        label: "Save",
        accelerator: "Command+S",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("file", "save");
        }
      }, {
        label: "Open",
        accelerator: "Command+O",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("file", "open");
        }
      }, {
        label: "Export to PDF",
        accelerator: "Command+P",
        click() {
          mainWindow.show();
          mainWindow.focus();
          exportToPDF();
        }
      }]
    }, {
      label: "Edit",
      submenu: [{
        label: "Undo",
        accelerator: "Command+Z",
        selector: "undo:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "undo");
        }
      }, {
        label: "Redo",
        accelerator: "Command+Shift+Z",
        selector: "redo:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "redo");
        }
      }, {
        type: "separator"
      },
      {
        label: "Move Forward",
        accelerator: "CMD+[",
        selector: "forward:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "forward");
        }
      },
      {
        label: "Move Backward",
        accelerator: "CMD+]",
        selector: "backward:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "backward");
        }
      },
      {
        label: "Move To Front",
        accelerator: "shift+CMD+[",
        selector: "front:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "front");
        }
      },
      {
        label: "Move To Back",
        accelerator: "shift+CMD+]",
        selector: "back:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "back");
        }
      },
      {
        label: "Delete Element",
        accelerator: "Backspace",
        selector: "delete:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "delete");
        }
      },
      {
        type: "separator"
      }, {
        label: "Cut",
        accelerator: "Command+X",
        selector: "cut:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "cut");
          mainWindow.webContents.cut();
        }
      }, {
        label: "Copy",
        accelerator: "Command+C",
        selector: "copy:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "copy");
          mainWindow.webContents.copy();
        }
      }, {
        label: "Paste",
        accelerator: "Command+V",
        selector: "paste:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "paste");
          mainWindow.webContents.paste();
        }
      }, {
        label: "Select All",
        accelerator: "Command+A",
        selector: "selectAll:"
      }]
    }, {
      label: "View",
      submenu: (process.env.NODE_ENV === "development") ? [{
        label: "Reload",
        accelerator: "Command+R",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.restart();
        }
      }, {
        label: "Toggle Full Screen",
        accelerator: "Ctrl+Command+F",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: "Toggle Developer Tools",
        accelerator: "Alt+Command+I",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.toggleDevTools();
        }
      }] : [{
        label: "Toggle Full Screen",
        accelerator: "Ctrl+Command+F",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: "Toggle Developer Tools",
        accelerator: "Alt+Command+I",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.toggleDevTools();
        }
      }]
    }, {
      label: "Play",
      submenu: [{
        label: "Slide Show",
        accelerator: "Command+L",
        click() {
          mainWindow.show();
          mainWindow.focus();
          playSlideShow();
        }
      }]
    }, {
      label: "Window",
      submenu: [{
        label: "Minimize",
        accelerator: "Command+M",
        selector: "performMiniaturize:"
      }, {
        label: "Close",
        accelerator: "Command+W",
        selector: "performClose:"
      }, {
        type: "separator"
      }, {
        label: "Bring All to Front",
        selector: "arrangeInFront:"
      }]
    }, {
      label: "Help",
      submenu: [{
        label: "Learn More",
        click() {
          shell.openExternal("http://electron.atom.io");
        }
      }, {
        label: "Documentation",
        click() {
          shell.openExternal("https://github.com/atom/electron/tree/master/docs#readme");
        }
      }, {
        label: "Community Discussions",
        click() {
          shell.openExternal("https://discuss.atom.io/c/electron");
        }
      }, {
        label: "Search Issues",
        click() {
          shell.openExternal("https://github.com/atom/electron/issues");
        }
      }]
    }];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    template = [{
      label: "&File",
      submenu: [{
        label: "&Open",
        accelerator: "Ctrl+O",
        click() {
          mainWindow.webContents.send("file", "open");
        }
      },
      {
        label: "&Save",
        accelerator: "Ctrl+S",
        click() {
          mainWindow.webContents.send("file", "save");
        }
      },
      {
        label: "&Export To PDF",
        accelerator: "Ctrl+P",
        click() {
          exportToPDF();
        }
      },
      {
        label: "&Close",
        accelerator: "Ctrl+Q",
        click() {
          mainWindow.close();
        }
      }]
    }, {
      label: "&Edit",
      submenu: [{
        label: "&Undo",
        accelerator: "Ctrl+Z",
        click() {
          mainWindow.webContents.send("edit", "undo");
        }
      }, {
        label: "&Redo",
        accelerator: "Ctrl+Shift+Z",
        click() {
          mainWindow.webContents.send("edit", "redo");
        }
      },
      {
        type: "separator"
      },
      {
        label: "&Move Forward",
        accelerator: "Ctrl+[",
        click() {
          mainWindow.webContents.send("edit", "forward");
        }
      },
      {
        label: "&Move Backward",
        accelerator: "Ctrl+]",
        click() {
          mainWindow.webContents.send("edit", "backward");
        }
      },
      {
        label: "&Move To Front",
        accelerator: "shift+Ctrl+[",
        click() {
          mainWindow.webContents.send("edit", "front");
        }
      },
      {
        label: "&Move To Back",
        accelerator: "shift+Ctrl+]",
        click() {
          mainWindow.webContents.send("edit", "back");
        }
      },
      {
        label: "&Delete Element",
        accelerator: "Backspace",
        click() {
          mainWindow.webContents.send("edit", "delete");
        }
      },
      {
        type: "separator"
      },
      {
        label: "&Cut",
        accelerator: "Ctrl+X",
        selector: "cut:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "cut");
          mainWindow.webContents.cut();
        }
      },
      {
        label: "&Copy",
        accelerator: "Ctrl+C",
        selector: "copy:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "copy");
          mainWindow.webContents.copy();
        }
      },
      {
        label: "&Paste",
        accelerator: "Ctrl+V",
        selector: "paste:",
        click() {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("edit", "paste");
          mainWindow.webContents.paste();
        }
      },
      {
        label: "&Select All",
        accelerator: "Ctrl+A",
        selector: "selectAll:"
      }
      ]
    },
    {
      label: "&View",
      submenu: (process.env.NODE_ENV === "development") ? [{
        label: "&Reload",
        accelerator: "Ctrl+R",
        click() {
          mainWindow.restart();
        }
      }, {
        label: "Toggle &Full Screen",
        accelerator: "F11",
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      },
      {
        label: "Toggle &Developer Tools",
        accelerator: "Alt+Ctrl+I",
        click() {
          mainWindow.toggleDevTools();
        }
      }] : [{
        label: "Toggle &Full Screen",
        accelerator: "F11",
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: "Toggle &Developer Tools",
        accelerator: "Alt+Ctrl+I",
        click() {
          mainWindow.toggleDevTools();
        }
      }]
    },
    {
      label: "&Play",
      submenu: [{
        label: "&Slide Show",
        accelerator: "Ctrl+L",
        click() {
          playSlideShow();
        }
      }]
    },
    {
      label: "&Help",
      submenu: [{
        label: "Learn More",
        click() {
          shell.openExternal("http://electron.atom.io");
        }
      }, {
        label: "Documentation",
        click() {
          shell.openExternal("https://github.com/atom/electron/tree/master/docs#readme");
        }
      }, {
        label: "Community Discussions",
        click() {
          shell.openExternal("https://discuss.atom.io/c/electron");
        }
      }, {
        label: "Search Issues",
        click() {
          shell.openExternal("https://github.com/atom/electron/issues");
        }
      }]
    }];
    menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
});
