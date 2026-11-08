# Run on a supported, authorized host

No script pushes commits or dispatches Actions. Use a new QA_OUTPUT per invocation. Native checkout must be `053ee3948170ac972bc1af44eacfa4857fc32a0f`; portfolio checkout must be `14a3df8e1a77ca2ad3329b43828671f69226ce77`. Verify those heads yourself before serving. Use Ubuntu 24.04 for comparison to the retained run. Pin Python Playwright 1.57.0 and install its WebKit 2227 dependencies. Install psutil for process telemetry. Keep the original 1440x1000 viewport and external HTTPS blocking.

Prepare a static server root with `techops-hero` pointing to the native repository and `theemrld-portfolio` to portfolio/public, then serve on 127.0.0.1:8765. For example, from the parent of both checkouts:

```bash
mkdir web
ln -s "$PWD/native" web/techops-hero
ln -s "$PWD/portfolio/public" web/theemrld-portfolio
python -m http.server 8765 --bind 127.0.0.1 --directory web
```

In a second shell, from this bundle's directory:

```bash
python probe.py --prepare-only
QA_OUTPUT=results/shared DEBUG=pw:browser python probe.py --lifecycle shared 2>shared-stderr.log
QA_OUTPUT=results/isolated DEBUG=pw:browser python probe.py --lifecycle isolated 2>isolated-stderr.log
QA_OUTPUT=results/reverse DEBUG=pw:browser python probe.py --order reverse 2>reverse-stderr.log
QA_OUTPUT=results/native-only DEBUG=pw:browser python startup.py --count 24 2>native-only-stderr.log
QA_OUTPUT=results/blank DEBUG=pw:browser python startup.py --payload blank --count 24 2>blank-stderr.log
QA_OUTPUT=results/objective DEBUG=pw:browser python probe.py --select 19-invalid-receipt-real-recompletion-preserves-evidence --lifecycle isolated --repeat 6 2>objective-stderr.log
```

Each command is an independent experiment; preserve its nonzero exit. Never substitute later passing blocks for earlier failures. A selected-case run is not a 27-case pass. Full original assertions remain in source but only selected cases execute. Stop before hosting unless owner approval has been obtained.

Retain results, stderr, source hashes, OS/browser versions, repository heads, kernel crash/OOM evidence when available, and this bundle. The harness has passed syntax/parity checks only; browser execution is pending. `objective-probe.py` is a separate reduced Chromium-only exploratory probe whose local launch failed; it is not part of the six-job WebKit plan.
