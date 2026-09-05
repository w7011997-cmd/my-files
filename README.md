# My Files

A simple personal file manager. Files are stored in Cloudinary; folders and
file records are stored locally on-device (localStorage) — there is no
server or database.

## 1. Cloudinary setup (one-time)

1. Go to your Cloudinary dashboard → **Settings → Upload**.
2. Under **Upload presets**, click **Add upload preset**.
3. Set **Signing Mode** to **Unsigned**.
4. (Optional) Set a default folder, e.g. `my-files`.
5. Save, and note the preset name.
6. Note your **Cloud name** from the dashboard home page.
7. Open the app → tap the gear icon → enter Cloud name + preset name → Save.

## 2. Run locally in Termux (quick test in browser)

```bash
pkg install nodejs -y
cd my-files
npx serve .
```

Open the printed local URL in a browser to test before wrapping it as an app.

## 3. Wrap as an Android app with Capacitor

```bash
pkg install nodejs git -y
cd my-files
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "My Files" "com.yourname.myfiles" --web-dir=.
npx cap add android
npx cap sync
```

Then build the APK the same way you do for your other Capacitor apps (Android
Studio, or a GitHub Actions workflow like the one used in your other repos).

## 4. Push to its own repo

```bash
cd my-files
git init
git add .
git commit -m "Initial commit: My Files app"
git remote add origin <your-new-repo-url>
git push -u origin main
```

This is a **separate repo** from your snooker app — nothing here touches
that project.

## Notes / limitations

- **No database**: folders and the list of uploaded files live in the
  browser's localStorage on the device. If you clear app data or reinstall,
  that list is lost — the files themselves stay in Cloudinary, but the app
  will no longer know about them.
- **Unsigned uploads only**: your Cloudinary cloud name and upload preset are
  visible inside the app. Fine for personal use; don't share the APK
  publicly, since someone could use the preset to upload files to your
  account.
- **"Remove" doesn't delete from Cloudinary**: deleting a Cloudinary asset
  requires a signed Admin API call (needs your API secret), which this app
  intentionally doesn't hold. "Remove" only forgets the local record. To
  actually delete files from Cloudinary, use the Cloudinary Media Library
  dashboard directly, or ask me to add a small signed-delete backend later
  if this becomes worth doing.
