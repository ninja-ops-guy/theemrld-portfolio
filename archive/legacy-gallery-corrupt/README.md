# Quarantined legacy gallery assets

These four original files are truncated WebP streams and fail full image decoding. Their exact bytes are retained here for recovery, outside the deployed public tree. No replacement artwork or relaxed decoder was used.

They were referenced only by the unused `src/sections/GalleryExperience.tsx` and unused `src/data/kGalleryArt.ts` exports at baseline 45fd039031a6e965c440a287dbf2a7c33018abad. Repository-wide reference search and the production JS/CSS output confirmed that neither consumer is reachable in the current build. The active gallery uses `public/k-world/assets/`, which remains unchanged.

The original paths are the paths below this directory prefixed with `public/`. Do not restore these bytes to public or activate those legacy consumers until intact source artwork is recovered and fully decoded.
