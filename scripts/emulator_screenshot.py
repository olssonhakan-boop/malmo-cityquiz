# -*- coding: utf-8 -*-
"""
emulator_screenshot.py  -  Tar skarmbild av Malmo CityQuiz i emulatorn.

Anvandning:
  python scripts/emulator_screenshot.py [skarm] [utfil]

Skarmar:
  home   Startskarmen (default)
  map    Kartan (utan modal)
  quiz   Kartan + QuizModal med forsta fragan

Exempel:
  python scripts/emulator_screenshot.py quiz quiz_modal.png

VIKTIG: Scriptet undviker medvetet uiautomator-dumpar under navigation
eftersom de triggar ANR pa langsamma emulatorer. Istallet anvands kanda
koordinater fran tidigare sessioner.
"""

import subprocess, sys, time, os, re

# ── Konfiguration ─────────────────────────────────────────────────────────────

ADB = os.path.join(os.environ.get("LOCALAPPDATA",""),
                   "Android","Sdk","platform-tools","adb.exe")
if not os.path.exists(ADB):
    ADB = "adb"

PACKAGE    = "se.unicorndevelopment.malmocityquiz"
SDCARD_PNG = "/sdcard/cls_screen.png"

# Kanda koordinater for 1080x2400-skarmen.
# Vid Malmo centrum-zoom (latitudeDelta ~0.04) ar markorerna typiskt i
# y-omradet 1100-1350 och x-omradet 200-900.
# Dessa ar fallback-koordinater om ingen markör hittas via pixelanalys.
COORD = {
    "starta_quiz":   (540,  620),
    "stadsvandring": (540,  960),
    "kategori":      (540, 1840),
    "starta_quiz2":  (540, 2160),
    "satt_igang":    (540, 2054),
    "anr_wait":      (320, 1600),   # Wait-knappen i ANR-dialogen (uppmatt fran skarmbild)
    # Kanda markorpositioner fran tidigare session (Malmo centrum, zoom 0.04)
    "markor1":       (540, 1237),
    "markor2":       (340, 1186),
    "markor3":       (475, 1177),
}


# ── adb-hjalp ─────────────────────────────────────────────────────────────────

def run(args, timeout=10):
    try:
        r = subprocess.run([ADB]+list(args), capture_output=True, timeout=timeout)
        return r.returncode, r.stdout.decode("utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        print(f"  [TIMEOUT] {args[:2]}")
        return -1, ""


def shell_cmd(cmd, timeout=10):
    return run(["shell"] + cmd.split(), timeout=timeout)


def tap(x, y, label=""):
    print(f"  [TAP] {label}  ({x},{y})")
    run(["shell","input","tap",str(x),str(y)], timeout=8)


def wait(s, reason=""):
    msg = f"  [WAIT] {s}s"
    if reason:
        msg += f"  ({reason})"
    print(msg)
    time.sleep(s)


def screencap(out_path):
    print("  [CAP] tar skarmbild...")
    run(["shell","screencap","-p",SDCARD_PNG], timeout=12)
    time.sleep(0.5)
    rc, _ = run(["pull",SDCARD_PNG,out_path], timeout=12)
    if rc != 0:
        wait(2)
        rc, _ = run(["pull",SDCARD_PNG,out_path], timeout=12)
    if rc != 0:
        print("  [FEL] kunde inte spara skarmbild")
        return False
    try:
        from PIL import Image
        img = Image.open(out_path)
        half = img.resize((img.width//2, img.height//2), Image.LANCZOS)
        half.save(out_path)
        print(f"  [OK] {out_path}  ({half.width}x{half.height}px)")
    except ImportError:
        print(f"  [OK] {out_path}  (installera Pillow for halvering)")
    return True


# ── Pixelbaserad markorfinnare (utan uiautomator) ─────────────────────────────

def find_markers_via_pixels(out_path="_tmp_map.png"):
    """
    Tar en skarmbild och soker efter Malmo CityQuiz markorfarg (guldton ~C8A840).
    Returnerar lista med (cx,cy) for hittade kluster av guldpixlar.
    INGEN uiautomator-dump = ingen ANR-risk.
    """
    screencap(out_path)
    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        print("  [INFO] Pillow/numpy ej installerat, kan inte analysera pixlar")
        return []

    img = Image.open(out_path).convert("RGB")
    arr = np.array(img)

    # Malmo CityQuiz markorfarg: guld ~(200,168,64) i full storlek,
    # ~(100,84,32) i halv storlek.
    # Vi soker pa den halverade bilden (540x1200).
    R, G, B = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    # Guldig markorfarg: hog rod, medel-gron, lag bla, gron < rod
    mask = (R > 150) & (G > 100) & (G < 200) & (B < 80) & (R > G + 30)

    # Hitta kluster
    ys, xs = np.where(mask)
    if len(xs) < 10:
        return []

    # Enkel klustring: gruppera pixlar inom 30px av varandra
    points = list(zip(xs.tolist(), ys.tolist()))
    clusters = []
    used = set()
    for i, (x,y) in enumerate(points):
        if i in used:
            continue
        cluster = [(x,y)]
        used.add(i)
        for j, (x2,y2) in enumerate(points):
            if j in used:
                continue
            if abs(x-x2) < 30 and abs(y-y2) < 30:
                cluster.append((x2,y2))
                used.add(j)
        if len(cluster) > 5:
            cx = sum(p[0] for p in cluster) // len(cluster)
            cy = sum(p[1] for p in cluster) // len(cluster)
            # Skala upp till full upplösning (bilden ar halverad)
            clusters.append((cx*2, cy*2))

    # Filtrera bort element utanfor kartytan (undre 200px ar BottomBar)
    clusters = [(x,y) for x,y in clusters if y < 2200]
    unique = list({(x//50*50, y//50*50):(x,y) for x,y in clusters}.values())
    return unique[:5]


# ── Navigationssteg ───────────────────────────────────────────────────────────

def blind_dismiss_anr():
    """
    Skickar CLOSE_SYSTEM_DIALOGS-broadcast som stanger ANR-dialoger och
    andra systemdialoger utan att behova koordinater eller UI-dump.
    Skadar inget om ingen dialog ar oppen.
    """
    print("  [ANR-dismiss] skickar CLOSE_SYSTEM_DIALOGS ...")
    run(["shell","am","broadcast","-a","android.intent.action.CLOSE_SYSTEM_DIALOGS"], timeout=8)
    time.sleep(1.5)


def grant_permissions():
    """Ger appen alla nodvandiga permissions direkt sa att inga dialoger dyker upp."""
    perms = [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
    ]
    for p in perms:
        run(["shell","pm","grant",PACKAGE,p], timeout=6)
    print("  [OK] GPS-permissions beviljade")


def go_to_home():
    print("[1] Startar appen rent...")
    run(["shell","am","force-stop",PACKAGE], timeout=6)
    wait(2)
    grant_permissions()
    run(["shell","am","start","-n",f"{PACKAGE}/.MainActivity"], timeout=6)
    wait(5,"appen startar")
    blind_dismiss_anr()
    wait(2,"efter ANR-dismiss")


def go_to_map():
    go_to_home()

    print("[2] HomeScreen -> SelectScreen")
    blind_dismiss_anr()
    tap(*COORD["starta_quiz"],   "Starta din Quiz")
    wait(4,"SelectScreen")

    print("[3] SelectScreen -> CategoryScreen")
    blind_dismiss_anr()
    tap(*COORD["stadsvandring"], "Valj stadsvandring")
    wait(4,"CategoryScreen")

    print("[4] CategoryScreen -> InfoScreen")
    blind_dismiss_anr()
    tap(*COORD["kategori"],      "Kategori")
    wait(2)
    blind_dismiss_anr()
    tap(*COORD["starta_quiz2"],  "Starta Quiz")
    wait(4,"InfoScreen")

    print("[5] InfoScreen -> MapScreen")
    blind_dismiss_anr()
    tap(*COORD["satt_igang"],    "Satt igang!")
    wait(10,"kartan + quiz-data laddar")
    blind_dismiss_anr()

    print("[6] Kollar skarmlaget...")
    screencap("_tmp_check.png")
    try:
        from PIL import Image
        img = Image.open("_tmp_check.png")
        # Om bilden innehaller text "responding" kan vi inte analysera det har,
        # men vi provar anda att trycka bort ANR via kand koordinat
        # (skadar inget om dialogen inte ar dar)
        w, h = img.size
        # Kontrollera om skarmen ar vit/tom (laddning) -> vanta mer
        import numpy as np
        arr = np.array(img.convert("L"))
        std = arr.std()
        if std < 20:
            print(f"  [INFO] Skarmen ar nara tom (std={std:.1f}), väntar 5s till...")
            wait(5,"extra laddningstid")
    except Exception as e:
        print(f"  [INFO] Kunde inte analysera skarmbild: {e}")


def go_to_quiz():
    go_to_map()

    print("[7] Soker kartmarkorer via pixelanalys (ingen uiautomator)...")
    markers = find_markers_via_pixels("_tmp_map.png")

    if markers:
        print(f"  [HITTADE] {len(markers)} markor(er): {markers}")
        cx, cy = markers[0]
        tap(cx, cy, f"markor ({cx},{cy})")
    else:
        print("  [FALLBACK] Pixelanalys hittade inget, provar kanda koordinater...")
        # Prova alla kanda markorpositioner i tur och ordning
        for key in ["markor1","markor2","markor3"]:
            tap(*COORD[key], key)
            wait(2)
            # Ta en snabb check om modalen oppnades
            screencap("_tmp_modal_check.png")
            try:
                from PIL import Image
                import numpy as np
                img = Image.open("_tmp_modal_check.png")
                arr = np.array(img.convert("L"))
                # Om nedre halvan ar ljusare (vit modalyta) -> modal ar oppen
                top_std = arr[:img.height//2,:].std()
                bot_std = arr[img.height//2:,:].std()
                if bot_std > top_std + 10:
                    print(f"  [OK] Modal troligtvis oppen efter {key}")
                    break
            except Exception:
                break

    wait(2,"QuizModal laddas")


# ── Main ──────────────────────────────────────────────────────────────────────

SCREENS = {"home":go_to_home,"map":go_to_map,"quiz":go_to_quiz}

def main():
    screen   = sys.argv[1] if len(sys.argv)>1 else "home"
    out_file = sys.argv[2] if len(sys.argv)>2 else f"screenshot_{screen}.png"

    if screen not in SCREENS:
        print(f"Okand skarm: '{screen}'. Valj: {', '.join(SCREENS)}")
        sys.exit(1)

    print(f"\n=== emulator_screenshot  [{screen}] -> {out_file} ===\n")
    SCREENS[screen]()
    screencap(out_file)

    # Rensa tempfiler
    for f in ["_tmp_check.png","_tmp_map.png","_tmp_modal_check.png"]:
        try: os.remove(f)
        except: pass

    print(f"\n=== Klar! -> {out_file} ===\n")


if __name__ == "__main__":
    main()
