"""R01: browser execution of immutable R00; no mock WebGL or source edits."""
import argparse, hashlib, json, platform
from pathlib import Path
from playwright.sync_api import sync_playwright

BLOB = '48c9e539570f08d04c3ac77b12d8e41934ca8607'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('html', type=Path)
    parser.add_argument('--chromium', default=None)
    parser.add_argument('--output', type=Path, default=Path('r01-output'))
    args = parser.parse_args()
    data = args.html.read_bytes()
    actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if actual != BLOB:
        raise SystemExit(f'Unexpected R00 blob: {actual}')
    args.output.mkdir(parents=True, exist_ok=True)
    results = {'sourceBlob': actual, 'sourceBytes': len(data), 'platform': platform.platform(), 'runs': []}
    with sync_playwright() as p:
        for name, flags in [('default', []), ('swiftshader', ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])]:
            browser = p.chromium.launch(executable_path=args.chromium, headless=True, args=['--no-sandbox'] + flags)
            page = browser.new_page(viewport={'width': 1120, 'height': 1000}, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            page.set_content(data.decode('utf-8'), wait_until='load')
            page.wait_for_function("document.querySelector('#status').textContent !== 'Initializing'")
            status = page.locator('#status').inner_text()
            page.locator('#test').click()
            page.wait_for_function("document.querySelector('#report').textContent.length > 0")
            result = json.loads(page.locator('#report').inner_text())
            gpu = page.evaluate('''() => {const c=document.getElementById('view'),g=c.getContext('webgl2',{antialias:true,alpha:false});if(!g)return null;const e=g.getExtension('WEBGL_debug_renderer_info');return {version:g.getParameter(g.VERSION),renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):null,depthBits:g.getParameter(g.DEPTH_BITS)};}''')
            run = {'name': name, 'flags': flags, 'browser': browser.version, 'initialStatus': status, 'webgl2': gpu, 'numeric': result, 'pageErrors': errors, 'shaderRenderControlsCamera': 'BLOCKED' if gpu is None else 'UNVERIFIED (manual follow-up required)'}
            page.screenshot(path=str(args.output / (name + '.png')), full_page=True)
            results['runs'].append(run)
            browser.close()
    (args.output / 'browser-evidence.json').write_text(json.dumps(results, indent=2)+'\n')
    print(json.dumps(results, indent=2))
    if not all(r['numeric']['pass'] and not r['pageErrors'] for r in results['runs']):
        raise SystemExit(1)

if __name__ == '__main__':
    main()
