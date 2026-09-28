# Homebook (desktop)

A private checkbook app. Everything is stored in `Documents/Homebook` on your computer.
It saves automatically after every change and keeps a daily backup for the last 30 days.
The app blocks all internet access.

## Build the installer (one time)

1. Install Node.js LTS from https://nodejs.org
2. Open a terminal in this folder and run:

       npm install

3. Try it first:

       npm start

4. Build the installer for the computer you're on:

   - Windows: `npm run dist:win`  ->  `dist/Homebook Setup 1.0.0.exe`
   - Mac:     `npm run dist:mac`  ->  `dist/Homebook-1.0.0.dmg`

   Build on the same kind of computer you're installing on.

## First launch warning

The app isn't code-signed, so the computer will warn you the first time.
- Windows: "Windows protected your PC" -> More info -> Run anyway
- Mac: right-click Homebook in Applications -> Open -> Open

## Files

- `main.js` – desktop shell: saving, daily backups, no-internet rule
- `preload.js` – the safe bridge between the app screen and the file system
- `app/index.html` – the app itself (also works on its own in a browser)

## Automatic builds on GitHub

`.github/workflows/build.yml` builds the Windows and Mac installers on GitHub's computers.

- **Test build:** GitHub → Actions → Build installers → Run workflow. Download the installers from the finished run's Artifacts section.
- **Release:** bump `"version"` in package.json, commit, then:

      git tag v1.0.1
      git push origin v1.0.1

  When both builds finish, a draft Release appears under Releases with the .exe and .dmg attached. Review it and click Publish.

The Mac build is "universal": it runs on both Apple Silicon and older Intel Macs.
