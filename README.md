# Thousand Days

A parent-friendly landing page for the **Thousand Days** baby-care companion and *Your Baby's First 1000 Days* by Dr Amey Gauns.

## What the page includes

- Doctor-led introduction to the app and book
- Pregnancy-to-toddler care timeline
- Feeding, vaccination, growth and stool-colour guidance
- Safe-sleep guidance based on AAP and WHO recommendations
- App feature previews and parent-focused calls to action
- Responsive layouts for phones, tablets and desktop screens
- Accessible navigation and keyboard-operated care-stage tabs

## Run locally

This is a static website with no build dependencies.

```powershell
python -m http.server 5201
```

Then open [http://localhost:5201](http://localhost:5201).

The landing page links to the Thousand Days app on port `5173` using the current hostname, so it also works when opened from another device on the same local network.

## Medical disclaimer

Thousand Days supports parent education and record keeping. It does not replace a paediatrician, emergency service, diagnosis or individual medical advice. In an emergency, contact your local emergency service or seek immediate medical care.
