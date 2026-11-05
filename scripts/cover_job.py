#!/usr/bin/env python3
"""Generate Dojo Notes post covers on the local ComfyUI GPUs. No external image APIs.

A post needs a cover when any of these is true:
  - its frontmatter has `coverPending: true`
  - its cover image is missing or is the shared placeholder
  - its cover is byte-identical to an older post's cover (the older post keeps it)

An optional `coverPrompt:` frontmatter field describes the picture. Without one, the
post title is used. Both fields are removed once the cover is written, and the post's
`image:` becomes cover.jpg.

Backends, in order: the RTX 3090 desktop over an SSH tunnel, then the always-on GPU VM.

Usage:
  scripts/cover_job.py                       # generate into the working tree
  scripts/cover_job.py --commit --push       # also commit and push to main
  scripts/cover_job.py --dry-run             # only list what needs a cover
  scripts/cover_job.py --placeholder         # (re)generate the shared placeholder
"""
import argparse
import hashlib
import io
import json
import random
import re
import socket
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageStat

REPO = Path(__file__).resolve().parent.parent
POSTS = REPO / 'posts'
IMAGES = REPO / 'public/images/posts'
PLACEHOLDER = REPO / 'public/images/site/cover-placeholder.jpg'

DESKTOP_SSH = 'mcooper@192.168.68.50'
VM_URL = 'http://192.168.68.110:8188'

WIDTH, HEIGHT = 1200, 675  # 16:9, what the post cards and OG images use
ACCENT = (179, 18, 44)  # --accent in styles/globals.css
PAPER = (245, 240, 230)
JOB_TIMEOUT = 900

STYLE = (
    'Japanese sumi-e ink wash illustration on warm cream washi paper with visible paper fibers, '
    'loose confident black ink brushstrokes, soft grey ink gradients, a single bold vermilion red '
    'accent, generous empty negative space, calm minimal editorial composition, wide landscape '
    'format, absolutely no text, no letters, no characters, no numbers, no logos, no signature, '
    'no stamp'
)
NEGATIVE = (
    'text, letters, words, watermark, signature, logo, stamp, kanji, calligraphy, photo, 3d render, '
    'neon, dark background, cluttered'
)
PLACEHOLDER_PROMPT = (
    'a single large brushed ink enso circle in black, with a small vermilion dot at its center'
)


def log(*args):
    print(time.strftime('%F %T'), *args, flush=True)


# ---------- ComfyUI ----------

def qwen_workflow(prompt, seed):
    """Qwen-Image-Edit 2511 with the Lightning LoRA, used as text-to-image."""
    return {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'qwen_image_edit_2511_fp8mixed.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': 'Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors', 'strength_model': 1.0}},
        '3': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['2', 0], 'shift': 3.1}},
        '5': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_2.5_vl_7b_fp8_scaled.safetensors', 'type': 'qwen_image'}},
        '6': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'qwen_image_vae.safetensors'}},
        '7': {'class_type': 'TextEncodeQwenImageEditPlus', 'inputs': {'clip': ['5', 0], 'prompt': prompt, 'vae': ['6', 0]}},
        '8': {'class_type': 'TextEncodeQwenImageEditPlus', 'inputs': {'clip': ['5', 0], 'prompt': '', 'vae': ['6', 0]}},
        '9': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': 1344, 'height': 768, 'batch_size': 1}},
        '10': {'class_type': 'KSampler', 'inputs': {'model': ['3', 0], 'positive': ['7', 0], 'negative': ['8', 0], 'latent_image': ['9', 0], 'seed': seed, 'steps': 8, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}},
        '11': {'class_type': 'VAEDecode', 'inputs': {'samples': ['10', 0], 'vae': ['6', 0]}},
        '12': {'class_type': 'SaveImage', 'inputs': {'images': ['11', 0], 'filename_prefix': 'dojo_cover'}},
    }


def sdxl_workflow(prompt, seed):
    """SDXL base on the GPU VM."""
    return {
        '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'sd_xl_base_1.0.safetensors'}},
        '2': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['1', 1], 'text': prompt}},
        '3': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['1', 1], 'text': NEGATIVE}},
        '4': {'class_type': 'EmptyLatentImage', 'inputs': {'width': 1344, 'height': 768, 'batch_size': 1}},
        '5': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': ['4', 0], 'seed': seed, 'steps': 25, 'cfg': 6.5, 'sampler_name': 'dpmpp_2m', 'scheduler': 'karras', 'denoise': 1.0}},
        '6': {'class_type': 'VAEDecode', 'inputs': {'samples': ['5', 0], 'vae': ['1', 2]}},
        '12': {'class_type': 'SaveImage', 'inputs': {'images': ['6', 0], 'filename_prefix': 'dojo_cover'}},
    }


def http_json(url, data=None, timeout=30):
    req = urllib.request.Request(url, json.dumps(data).encode() if data is not None else None, {'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.load(res)


def has_model(base, node, field, name):
    info = http_json(f'{base}/object_info/{node}', timeout=15)
    return name in info[node]['input']['required'][field][0]


class Backend:
    """One reachable ComfyUI. Holds an SSH tunnel open when it needs one."""

    def __init__(self, name, base, workflow, tunnel=None):
        self.name, self.base, self.workflow, self.tunnel = name, base, workflow, tunnel

    def render(self, prompt, seed):
        pending = http_json(f'{self.base}/queue')
        log(f'{self.name}: queue running={len(pending["queue_running"])} pending={len(pending["queue_pending"])}')
        pid = http_json(f'{self.base}/prompt', {'prompt': self.workflow(prompt, seed)})['prompt_id']
        deadline = time.time() + JOB_TIMEOUT
        while time.time() < deadline:
            hist = http_json(f'{self.base}/history/{pid}')
            if pid in hist:
                status = hist[pid]['status']
                if status.get('status_str') == 'error':
                    raise RuntimeError(f'{self.name} job failed: {status.get("messages", "")}'[:400])
                if status.get('completed'):
                    img = hist[pid]['outputs']['12']['images'][0]
                    with urllib.request.urlopen(f'{self.base}/view?' + urllib.parse.urlencode(img), timeout=60) as res:
                        return Image.open(io.BytesIO(res.read())).convert('RGB')
            time.sleep(3)
        raise TimeoutError(f'{self.name} job timed out')

    def close(self):
        if self.tunnel:
            self.tunnel.terminate()
            self.tunnel.wait(timeout=10)


def connect_desktop():
    """Tunnel to the desktop's ComfyUI. Never starts or stops ComfyUI there, so it can't disturb other users of it."""
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    tunnel = subprocess.Popen(
        ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '-o', 'ExitOnForwardFailure=yes',
         '-N', '-L', f'{port}:127.0.0.1:8188', DESKTOP_SSH],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    base = f'http://127.0.0.1:{port}'
    for _ in range(12):
        time.sleep(1)
        if tunnel.poll() is not None:
            return None
        try:
            http_json(f'{base}/system_stats', timeout=4)
            if has_model(base, 'UNETLoader', 'unet_name', 'qwen_image_edit_2511_fp8mixed.safetensors'):
                return Backend('3090', base, qwen_workflow, tunnel)
            break
        except OSError:
            continue
    tunnel.terminate()
    return None


def connect_vm():
    try:
        http_json(f'{VM_URL}/system_stats', timeout=6)
        if has_model(VM_URL, 'CheckpointLoaderSimple', 'ckpt_name', 'sd_xl_base_1.0.safetensors'):
            return Backend('gpu-vm', VM_URL, sdxl_workflow)
    except (OSError, KeyError):
        pass
    return None


def connect(force=None):
    if force != 'vm':
        backend = connect_desktop()
        if backend:
            return backend
        log('3090 ComfyUI not reachable')
    if force != 'desktop':
        backend = connect_vm()
        if backend:
            return backend
        log('GPU VM ComfyUI not reachable')
    return None


# ---------- Images ----------

def add_seal(img):
    """Stamp the Dojo Notes hanko (same geometry as components/layout/logo.js) in the corner."""
    size, margin, scale = 46, 22, 4
    seal = Image.new('RGBA', (64 * scale, 64 * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(seal)
    s = scale
    draw.rounded_rectangle((3 * s, 3 * s, 61 * s, 61 * s), radius=12 * s, fill=ACCENT + (255,))
    draw.arc((14 * s, 14 * s, 50 * s, 50 * s), start=-16, end=300, fill=PAPER + (255,), width=6 * s)
    for x, y, r in ((41.5, 15.5, 3), (49.6, 27, 3), (32, 32, 4)):
        draw.ellipse(((x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s), fill=PAPER + (255,))
    seal = seal.resize((size, size), Image.LANCZOS)
    img.paste(seal, (WIDTH - size - margin, HEIGHT - size - margin), seal)
    return img


def finish(raw):
    w, h = raw.size
    target = WIDTH / HEIGHT
    if w / h > target:
        crop = int(h * target)
        raw = raw.crop(((w - crop) // 2, 0, (w + crop) // 2, h))
    else:
        crop = int(w / target)
        raw = raw.crop((0, (h - crop) // 2, w, (h + crop) // 2))
    return add_seal(raw.resize((WIDTH, HEIGHT), Image.LANCZOS))


def looks_valid(img):
    # A blank or failed render is nearly one flat colour.
    return max(ImageStat.Stat(img.convert('L')).stddev) > 12


def save_jpeg(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, 'JPEG', quality=84, optimize=True, progressive=True)


def render_cover(backend, concept, path):
    prompt = f'{concept}. {STYLE}'
    for attempt in range(2):
        img = finish(backend.render(prompt, random.randint(1, 2**31 - 1)))
        if looks_valid(img):
            save_jpeg(img, path)
            return
        log(f'blank render, retry {attempt + 1}')
    raise RuntimeError('render looks blank')


# ---------- Posts ----------

def frontmatter(text):
    match = re.match(r'---\n(.*?)\n---\n', text, re.S)
    if not match:
        return None, None
    return match.group(1), match.end()


def field(fm, key):
    match = re.search(rf'^{key}:[ \t]*(.*)$', fm, re.M)
    return match.group(1).strip().strip('\'"') if match else None


def load_posts():
    posts = []
    for path in sorted(POSTS.glob('*.md')):
        text = path.read_text()
        fm, _ = frontmatter(text)
        if fm is None:
            continue
        slug = path.stem
        image = field(fm, 'image')
        cover = IMAGES / slug / image if image else None
        digest = None
        if cover and cover.is_file():
            digest = hashlib.md5(cover.read_bytes()).hexdigest()
        posts.append({
            'slug': slug, 'path': path, 'title': field(fm, 'title'), 'date': field(fm, 'date') or '',
            'prompt': field(fm, 'coverPrompt'), 'pending': field(fm, 'coverPending') == 'true',
            'digest': digest,
        })
    return posts


def needing_covers(posts):
    placeholder = hashlib.md5(PLACEHOLDER.read_bytes()).hexdigest() if PLACEHOLDER.is_file() else None
    need, seen = {}, {}
    for post in sorted(posts, key=lambda p: (p['date'], p['slug'])):
        reason = None
        if post['pending']:
            reason = 'coverPending'
        elif post['digest'] is None:
            reason = 'missing cover'
        elif post['digest'] == placeholder:
            reason = 'placeholder'
        elif post['digest'] in seen:
            reason = f'same image as {seen[post["digest"]]}'
        if post['digest'] and not reason:
            seen[post['digest']] = post['slug']
        if reason:
            need[post['slug']] = reason
    return need


def finish_frontmatter(path):
    text = path.read_text()
    fm, end = frontmatter(text)
    fm = re.sub(r'^coverPending:.*\n?', '', fm, flags=re.M)
    fm = re.sub(r'^coverPrompt:.*\n?', '', fm, flags=re.M).rstrip('\n')
    if re.search(r'^image:', fm, re.M):
        fm = re.sub(r'^image:.*$', 'image: cover.jpg', fm, flags=re.M)
    else:
        fm += '\nimage: cover.jpg'
    path.write_text(f'---\n{fm}\n---\n{text[end:]}')


def git(*args):
    return subprocess.run(['git', '-C', str(REPO), *args], check=True, capture_output=True, text=True).stdout.strip()


def commit_and_push(done, push):
    for slug in done:
        git('add', f'posts/{slug}.md', f'public/images/posts/{slug}/cover.jpg')
    names = ', '.join(done)
    git('commit', '-m', f'chore(cover): generate cover for {names}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')
    if push:
        for attempt in range(2):
            try:
                git('pull', '--rebase', 'origin', 'main')
                git('push', 'origin', 'HEAD:main')
                log('pushed', git('rev-parse', '--short', 'HEAD'))
                return
            except subprocess.CalledProcessError as err:
                log('push failed:', err.stderr.strip()[:300])
                time.sleep(20)
        raise RuntimeError('could not push to main')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--commit', action='store_true')
    ap.add_argument('--push', action='store_true')
    ap.add_argument('--placeholder', action='store_true')
    ap.add_argument('--backend', choices=['desktop', 'vm'])
    ap.add_argument('--only', nargs='*', help='limit to these slugs')
    args = ap.parse_args()

    posts = {p['slug']: p for p in load_posts()}
    need = needing_covers(list(posts.values()))
    if args.only:
        need = {s: r for s, r in need.items() if s in args.only}
    if args.dry_run:
        for slug, reason in need.items():
            print(f'{slug}: {reason}')
        return 0
    if not need and not args.placeholder:
        log('all covers are unique')
        return 0

    backend = connect(args.backend)
    if not backend:
        log('no ComfyUI backend reachable; will retry on the next run')
        return 1
    log('using', backend.name)
    done, failed = [], []
    try:
        if args.placeholder:
            render_cover(backend, PLACEHOLDER_PROMPT, PLACEHOLDER)
            log('placeholder written')
        for slug, reason in need.items():
            post = posts[slug]
            concept = post['prompt'] or f'a simple visual metaphor for the topic "{post["title"]}"'
            log(f'{slug} ({reason})')
            try:
                render_cover(backend, concept, IMAGES / slug / 'cover.jpg')
                finish_frontmatter(post['path'])
                done.append(slug)
            except (RuntimeError, OSError) as err:
                log(f'{slug} failed: {err}')
                failed.append(slug)
    finally:
        backend.close()
    if done and args.commit:
        commit_and_push(done, args.push)
    log(f'done={len(done)} failed={len(failed)}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
