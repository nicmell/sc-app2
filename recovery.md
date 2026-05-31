# Raspberry Pi boot recovery (won't boot / no SSH after a `config.txt` edit)

Notes for recovering the Pi after a bad `/boot/firmware/config.txt` edit or a
corrupted SD boot partition — written for a **Pi 5 + macOS**, but mostly general.

## What the green LED is telling you

The green **ACT** LED blinks an error code (groups of flashes with pauses):

| Flashes | Meaning |
|--------:|---------|
| 3 | Generic boot failure |
| 4 | `start*.elf` not found |
| 7 | Kernel image not found |
| **8** | **SDRAM not recognised** |

Decisive sanity check: **remove the SD card and power on.**
- **Solid green, no error blink** → the board + its EEPROM bootloader are healthy
  (on a Pi 5 the EEPROM brings up SDRAM). The fault is on the **card**.
- An error code only **with** the card inserted → the card's **FAT boot
  partition** (firmware / `config.txt`) is the problem, *not* your data.

Your files live on the card's separate **`ext4` root** partition, which these
failures don't touch — so recovery keeps your data.

## Key facts that make this safe

- macOS mounts only the small **FAT** partition (`bootfs`); it can't read `ext4`.
  So everything below touches **only** the boot partition.
- `cmdline.txt` holds `root=PARTUUID=xxxxxxxx-02`, pointing at your `ext4` root.
  As long as you don't repartition, that PARTUUID is stable — **always keep your
  own `cmdline.txt`.**
- The kernel on `bootfs` (`kernel_2712.img`, `initramfs_2712`) must match the
  modules in `/lib/modules` on your root. **Your own boot files match; a freshly
  downloaded image's kernel may not** (see the caveat below).

---

## Step 0 — first, just fix the file on the card

Power off the Pi, move the SD card to the Mac (a `bootfs` volume mounts), and:

```bash
ls -la /Volumes/bootfs/            # confirm the file is exactly "config.txt" (not config.txt.rtf/.txt)
nano /Volumes/bootfs/config.txt    # revert your edit; e.g. remove a bad/extra dtoverlay param
diskutil eject /Volumes/bootfs     # ALWAYS eject — never just pull the card, or you re-corrupt it
```

Edit only in a **plain-text** editor (TextEdit: *Format → Make Plain Text* first).
Boot the Pi. If fixed, stop here.

## Step 1 — repair the FAT filesystem (non-destructive)

`ls` can look fine while the FAT cluster chains are corrupt. Repair them:

```bash
diskutil repairVolume /Volumes/bootfs
diskutil eject /Volumes/bootfs
```

Boot. If fixed, stop here.

## Step 2 — reformat the boot partition + restore your own files (keeps data)

If it still errors (e.g. 8 flashes), reformat the FAT partition (clears deeper
corruption) and put **your own** boot files back — this keeps the kernel matched
to your root, so there's no module-mismatch risk.

```bash
cp -a /Volumes/bootfs ~/bootfs-backup        # back up the current boot files first

diskutil list                                 # IDENTIFY YOUR CARD by size:
                                              #   sX s1 = ~512MB FAT  (bootfs)  ← reformat this
                                              #   sX s2 = large Linux (ext4)    ← NEVER touch
diskutil eraseVolume FAT32 BOOTFS /dev/diskNs1   # ⚠️ use YOUR card's s1 — wrong disk = data loss

cp -a ~/bootfs-backup/.  /Volumes/BOOTFS/     # restore your files (matching kernel + your cmdline.txt)
diskutil eject /Volumes/BOOTFS
```

Reformatting `s1` doesn't change the partition table, so the PARTUUIDs (and your
`ext4` root) stay valid. Boot. If fixed, stop here.

## Step 3 — only if Step 2 still fails: fresh boot files

Step 2 failing means the boot **files** (or the card) are bad. Get fresh files:

**Where:** Raspberry Pi OS **Lite (64-bit)** — <https://www.raspberrypi.com/software/operating-systems/>
(Lite suits a headless scsynth box).

**Getting its boot files onto the Mac:**
- *Easiest* — flash that OS to **any spare/blank SD card** with **Raspberry Pi
  Imager**, then plug that card into the Mac; its `bootfs` mounts and you copy
  from it.
- *No spare card* — mount the image directly:
  ```bash
  xz -dk ~/Downloads/<image>.img.xz
  hdiutil attach -imagekey diskimage-class=CRawDiskImage -nomount ~/Downloads/<image>.img
  diskutil list                       # find the image's FAT partition, e.g. /dev/disk7s1
  diskutil mount /dev/disk7s1
  ```

**Apply** (reformat your card's `bootfs` as in Step 2, then):

```bash
cp -a "/Volumes/<fresh-bootfs>/."  /Volumes/BOOTFS/    # fresh firmware/kernel/overlays/initramfs
cp -a ~/bootfs-backup/cmdline.txt  /Volumes/BOOTFS/    # YOUR root=PARTUUID=… (critical)
cp -a ~/bootfs-backup/config.txt   /Volumes/BOOTFS/    # your config (re-add the DAC overlay, below)
diskutil eject /Volumes/BOOTFS
```

> ⚠️ **Kernel mismatch:** fresh files carry a newer kernel than your root's
> `/lib/modules`. It should still boot and reach SSH over Ethernet — then run
> `sudo apt update && sudo apt full-upgrade` to resync modules. If you'd rather
> avoid that, do a full clean reflash instead (next).

## Step 4 — last resort: full reflash, keeping data

If the card itself is failing (Step 2/3 don't stick), copy your data off, then
reflash:

1. Read the `ext4` root — macOS can't natively, so use one of:
   - a Linux machine / live USB,
   - an ext4 reader on macOS (e.g. Paragon extFS for Mac, free trial), or
   - flash a fresh OS to a spare card, boot the Pi from it, attach the old card
     via a USB SD reader → the running Pi mounts the old `ext4` and you copy data.
2. Reflash the card (or a new one) with Raspberry Pi Imager (enable SSH + user in
   Imager's settings). A failing card → use a new one.
3. Re-create the StrudelDirt setup from `instructions.md`.

---

## After it boots: re-add the HiFiBerry overlay

A reverted/replaced `config.txt` often loses the DAC overlay. Under `[all]` in
`/boot/firmware/config.txt`:

```
[all]
dtoverlay=hifiberry-dac8x
```

`sudo reboot`, then `aplay -l` should list the HiFiBerry again.

## Avoiding this next time

- Make `config.txt` / system edits **over SSH**, so a bad change is fixed with
  another SSH edit — not a card pull.
- Prefer the **`/etc/asound.conf`** method for the default sound card; it can't
  affect boot (unlike `dtoverlay=...,noaudio` in `config.txt`). See
  `instructions.md` → *Making the DAC the default card*.
- On macOS, **always `diskutil eject`** the card before removing it.
