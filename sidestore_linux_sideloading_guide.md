# StriveRing — Linux SideStore Sideloading Guide

This guide outlines a completely free, non-macOS workflow to compile and run **StriveRing** natively on your iPhone with all Widgets and Dynamic Island Live Activities fully functional, without needing a paid Apple Developer Account.

---

## 🛠️ Phase 1: Compile the Unsigned `.ipa` File (via GitHub Actions)

Apple's EAS Build cloud service requires a paid Developer Account ($99/year) to compile device builds. To bypass this fee completely, we set up a free **GitHub Actions CI/CD workflow** in your codebase that compiles a native, unsigned `.ipa` using GitHub's free macOS runners.

### Step 1: Create a GitHub Repository
1. Go to **[GitHub](https://github.com/)** and create a new repository (either Public or Private) named `StriveRing-ios`.
2. Do not initialize it with a README or `.gitignore` (keep it empty).

### Step 2: Push Your Code to GitHub
Open your terminal on your computer and run these commands to link your repository and push the code:
```bash
# Navigate to your workspace
cd ~/StriveRing-ios

# Link your new GitHub repository
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/StriveRing-ios.git

# Rename main branch to master (if needed) and push
git branch -M master
git push -u origin master
```

### Step 3: Trigger the Build in GitHub Actions
1. Navigate to your repository page on GitHub.
2. Click the **Actions** tab at the top.
3. Select **Build Unsigned iOS IPA** in the left menu.
4. Click the **Run workflow** dropdown on the right and select the `master` branch, then click **Run workflow**.
5. The workflow will spin up a free macOS runner, prebuild the React Native environment, compile the SwiftUI targets (Widgets & Live Activities), and package an unsigned `StriveRing.ipa` file.
6. Once the build completes (approx. 5-8 minutes), click on the completed run and scroll down to the **Artifacts** section to download `StriveRing-unsigned-ipa.zip`. Extract it to get your `StriveRing.ipa` file!

---

## 📲 Phase 2: Install SideStore via iLoader on Linux

Because AltServer requires a background PC to refresh apps every week, we will use **SideStore** via the modern **iLoader** utility. SideStore uses a local on-device VPN (WireGuard) to re-sign apps directly on your iPhone without needing your PC ever again!

### Step 1: Run iLoader
We have already downloaded the latest Linux `iLoader` AppImage and set it up for you at:
`~/.gemini/antigravity-ide/scratch/sideload-setup/iloader-linux-amd64.AppImage`

To run it, open your terminal and execute:
```bash
cd ~/.gemini/antigravity-ide/scratch/sideload-setup/
./iloader-linux-amd64.AppImage
```
*Note: This is a GUI utility and requires running within your active Linux desktop session.*

### Step 2: Sideload SideStore onto Your iPhone
1. Plug your iPhone into your PC via a USB cable.
2. Tap **"Trust This Computer"** on your iPhone screen and enter your passcode.
3. In the `iLoader` GUI:
   - Click **Install SideStore**.
   - Input your Apple ID and password (we highly recommend creating a **burner/secondary Apple ID** for sideloading security).
   - iLoader will automatically pair with your phone and install SideStore!

### Step 3: Enable Developer Mode (iOS 16+)
1. Disconnect your iPhone and open **Settings**.
2. Go to **Privacy & Security > Developer Mode** (scroll to the bottom).
3. Toggle it **ON** and restart your phone.
4. After reboot, unlock your phone, tap **Turn On** on the popup, and enter your passcode.
5. Go to **Settings > General > VPN & Device Management**, tap your developer Apple ID, and choose **Trust**.

---

## 🚀 Phase 3: Install StriveRing & Enable On-Device Refreshing

Now that your phone is unlocked and SideStore is installed, you are ready to sideload your compiled app:

1. **Configure WireGuard VPN (For PC-Free Refreshing)**:
   - Open SideStore. It will prompt you to download a free WireGuard configuration file (`SideStore.conf`).
   - Download the official free **WireGuard** app from the App Store.
   - Import the `SideStore.conf` file into WireGuard.
   - Whenever you want to install or refresh apps, toggle the WireGuard VPN **ON** in the WireGuard app.
2. **Install StriveRing**:
   - Download your compiled `StriveRing.ipa` file (from Phase 1) directly to your iPhone's Files app (you can upload it to iCloud Drive, Google Drive, or send it to yourself).
   - Open **SideStore**, go to the **My Apps** tab, and tap the **`+`** icon in the top left.
   - Select your `StriveRing.ipa` file.
   - SideStore will sign and install the app natively!
3. **Add Widgets & Live Activities**:
   - Long-press your Home Screen, tap the `+` in the top left, search for **StriveRing**, and add the Small or Medium biometric widgets!
   - Start any habit stopwatch in the app to see it seamlessly update inside the **Dynamic Island**!
