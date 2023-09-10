const { app, BrowserWindow, desktopCapturer, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const { writeFile } = require("fs");

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools();

  const inputSources = await desktopCapturer.getSources({ types: ["window", "screen"] });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => win.webContents.send("SET_SOURCE", source),
      };
    })
  );

  ipcMain.on("show-video-options", (event) => {
    videoOptionsMenu.popup();
  });

  ipcMain.on("open-save-dialog", async (event, buffer) => {
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: "Save video",
      defaultPath: `vid-${Date.now()}.webm`,
    });

    if (filePath) {
      writeFile(filePath, buffer, () => console.log("video saved successfully!"));
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
