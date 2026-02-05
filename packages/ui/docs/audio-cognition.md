# bb-ui Audio Cognition + Emotion Verification (Draft Spec)

Status: draft  
Owner: bb-ui  
Last updated: 2026-01-20  

## 0) Summary

`bb-ui` already models **emotion/expression** (AVO) visually. A “complete” cognition system should be multi-modal: audio must become both:

1) A **first-class cognition output** (speech + earcons + ambience/music that tracks mode/effort/risk/persona stability), and
2) A **verification-first artifact** (technical quality + semantic correctness + affect alignment + licensing/policy compliance).

This spec covers:

- **Speech output** (TTS) and how it maps from `CognitionState`.
- **Audio-space cognition** (what we can infer from incoming audio streams).
- A concrete **validation/verification pipeline** that produces an `AudioProof` bundle.
- A practical path to experiment with **Kyutai Pocket TTS**.
- A research-backed “elite path” roadmap: `docs/audio-elite-path.md`.

---

## 1) Goals / Non-goals

### 1.1 Goals

- **Cross-modal coherence**: visuals + text + audio tell the same emotional story (no “cheerful voice” while UI shows error stress).
- **Verification-native**: every synthesized audio output can be validated and shipped with a proof bundle.
- **Pluggable providers**: Pocket TTS, browser TTS, or other backends can implement the same interface.
- **Policy + licensing correctness**: voice cloning defaults off; voice catalog is license-aware and allowlisted.
- **Low-latency UX**: support streaming playback, barge-in, and graceful degradation when verification is slow or unavailable.

### 1.2 Non-goals

- Building a full DSP/middleware stack inside `bb-ui` (see `research/audio-engine/*` for that scope).
- Guaranteeing “true emotion” in audio—only validated alignment to target affect metrics (which are inherently noisy).
- Running heavy models in the browser by default (preferred: local service / edge worker).

---

## 2) Concepts (data model vocabulary)

### 2.1 Speech plan vs audio artifact vs proof

- **SpeechPlan**: an *intent* to speak, derived from cognition + text.
- **AudioArtifact**: the resulting audio bytes/stream (WAV/PCM/Opus).
- **AudioProof**: a portable verification bundle (manifest + metrics + verdict) aligned with Aegis Net / Patch+Proof posture.

### 2.2 Audio tokens (non-speech)

Treat non-speech cues like UI tokens:

- `earcons`: short confirmation/warning/error stingers
- `ambience`: low-level presence bed
- `musicLayers`: adaptive music layers (vertical layering / horizontal resequencing; see `research/audio-engine/cyntra-audio-research.md`)

---

## 3) Architecture (high level)

```
CognitionState + Text
   │
   ▼
Audio Planner (pure mapping + policy clamps)
   │  produces SpeechPlan + AudioTokens
   ▼
SpeechSynthesisProvider (Pocket TTS, etc.)
   │  produces AudioArtifact (stream or file)
   ├──────────────► Playback (UI)
   ▼
AudioVerifier (quality + ASR + SER)
   │
   ▼
AudioProof (verdict + metrics + evidence)
```

Two loops matter:

- **Fast loop**: streaming playback + barge-in (latency-critical).
- **Slow loop**: verification + calibration (quality-critical).

The UI must support “play now, verify soon” with policy-controlled fallbacks:

- `policy.trustTier` determines whether unverified audio is allowed to play.
- `policy.safetyMode` clamps expressiveness and may require verification before playback.

---

## 4) Speech output (Pocket TTS-first)

### 4.1 Pocket TTS integration posture

Assume Pocket TTS runs **outside** the browser:

- A local Python service loads the model and voices.
- `bb-ui` calls it over HTTP/WebSocket to request streaming audio.

This avoids shipping large model weights into the web bundle and makes verification easier (ASR/SER can run alongside TTS).

### 4.2 Provider interface shape (proposed)

Minimal provider contract:

- request: `{ text, voiceId, controls, outputFormat, seed?, traceId? }`
- streaming response: chunks + metadata events (start/progress/end)
- final response includes: `artifactHash`, `durationMs`, and model/voice metadata

### 4.3 Mapping from `CognitionState` → `SpeechPlan`

Use cognition primitives (from `docs/cognition-system.md`) as the control surface:

- `mode` (listening/deliberating/acting/explaining/recovering/blocked)
- `personaAnchor`, `personaDriftRisk` (Assistant Axis–inspired stability)
- `confidence`, `risk`, `planDrift`, `workload`, `timePressure`
- `moodAVO`, `emotionAVO` (targets)

Baseline rules (illustrative):

- High `personaDriftRisk` → force “grounded voice preset”, reduce expressiveness controls, shorten phrasing.
- High `risk` or low `confidence` → avoid theatricality; prefer concise, neutral prosody.
- `mode=explaining` + high openness → slightly warmer phrasing (but still policy-clamped).
- `mode=recovering` + high `errorStress` → softer, slower cadence; avoid “chirpy mismatch”.

### 4.4 Controls when the TTS model has limited knobs

If Pocket TTS exposes limited explicit prosody control, use:

1) **Voice selection** (voices/presets act like style priors)
2) **Sampling controls** (temperature, etc.) when available
3) **Text rendering** (punctuation, sentence boundaries, pauses)

Keep a calibration table per voice:

- `voiceId` × `targetAffect` → best-known controls + expected verification tolerances

---

## 5) Non-speech audio (earcons + adaptive music)

### 5.1 Earcons as “verification-cheap” affect

Earcons are valuable because they’re deterministic and cheap to verify:

- `success`: short consonant chime (high valence, moderate arousal)
- `warning`: mid-frequency pulse (neutral valence, elevated arousal)
- `error`: low-frequency thud + noise tick (low valence, high arousal)

Earcons should be parameterized by AVO so they can match visuals.

### 5.2 Adaptive music alignment (optional)

If the host app uses Cyntra’s audio engine concepts (`research/audio-engine/ARCHITECTURE.md`):

- Map `emotionAVO.arousal` → *intensity* (stem layering)
- Map `risk/planDrift` → *tension curve*
- Map `mode` transitions → *horizontal resequencing* boundaries + stingers

bb-ui should only output **tokens and parameters**; an engine (kernel or host) performs mixing/spatialization.

---

## 6) Audio-space cognition (input signals)

Audio shouldn’t only be output; it can be a cognition input stream.

### 6.1 Incoming streams

Potential sources:

- User mic (local input)
- Remote audio track (e.g., LiveKit `audioTrack` from `usePlaySession`)
- Game/world audio (if the host exposes it)

### 6.2 Extracted signals (minimal → advanced)

Minimal (cheap, local):

- RMS / loudness over time
- VAD (voice activity detection): speaking vs silence
- Barge-in detection: user starts speaking while TTS plays

Advanced (heavier, optional):

- ASR transcript (semantic events)
- SER (speech emotion VAD or categorical) as a *user affect signal*
- Acoustic scene classification (alarm, explosion, crowd, etc.)

### 6.3 Mapping input audio → cognition updates

Examples:

- User barge-in → `mode = listening`, reduce arousal, stop playback.
- Prolonged user silence after “blocked/needs_input” → increase `timePressure`, soften prompting earcons.
- Detected user distress (SER high arousal + low valence) → raise `risk`, force conservative persona/audio outputs, surface “request human support” intervention (see `docs/cognition-system.md`).

Privacy posture:

- Treat audio as highly sensitive; require explicit user consent and clear on-device/remote processing disclosure.
- Prefer local processing for VAD and basic features; allow host policy to disable all inference.

---

## 7) Audio verification (must-have gates)

Verification produces an `AudioProof` with structured gate results.

Concrete schema: `docs/schemas/audio-proof.schema.json`.

### 7.1 Technical quality gate (objective)

Typical checks:

- sample rate + channels normalized
- clipping/headroom (no hard clipping; target peak headroom)
- loudness normalization target (LUFS) and dynamic range sanity checks
- duration bounds (no accidental 30s pauses)

### 7.2 Semantic correctness gate (ASR)

Validate that “what was spoken” matches the intended text:

- WER and/or keyword coverage
- allow punctuation differences, but not missing safety-critical words (e.g., “don’t”)

### 7.3 Affect alignment gate (SER)

Validate that produced speech expresses the intended affect.

#### 7.3.1 AVO → expected VAD

Keep AVO as the canonical affect space:

- `valence_expected = AVO.valence`
- `arousal_expected = AVO.arousal`
- `dominance_expected`:
  - v1: ignore dominance (validate only V+A), or
  - bridge: `dominance_expected = clamp(0.2 + 0.6 * AVO.openness + 0.2 * (AVO.arousal - 0.5))`

#### 7.3.2 Scoring

- `errV = |V_pred - V_expected|`
- `errA = |A_pred - A_expected|`
- optional `errD`

Default tolerances (until calibrated):

- `tolV = 0.20`, `tolA = 0.20`

Run SER on **segments** (5–15s windows) for long audio; fail if the tail drifts.

### 7.4 Multi-modal consistency gate (elite “feel”)

Optionally compute a single “consistency score”:

- compare audio VAD to target AVO
- compare visual AVO to target AVO
- penalize cross-modal disagreement (audio cheerful, visuals stressed)

This is a UX gate: it doesn’t claim truth, it prevents jarring mismatches.

### 7.5 Optional “elite” gates (recommended as you mature)

As you move toward a fully “elite path” (see `docs/audio-elite-path.md`), add orthogonal gates:

- `watermark`: watermark embed/detect results (provenance)
- `speakerConsistency`: speaker embedding similarity to an allowlisted profile (if applicable)
- `antiSpoof`: deepfake/spoof detection on incoming audio (if applicable)
- `mos`: predicted MOS as a regression signal (don’t hard-gate early)
- `safetyText` / `safetyAudio`: explicit safety checks (content policy, disallowed patterns)

These are modeled in `docs/schemas/audio-proof.schema.json`.

---

## 8) Closed-loop generation (“generate until it verifies”)

To make the system cutting-edge in practice, include a bounded, deterministic refinement loop:

1) Generate audio with a `SpeechPlan`.
2) Run verification gates.
3) If failed, apply a targeted adjustment policy and retry (up to `N` attempts):
   - semantic fail → reduce punctuation weirdness, slow down phrasing, switch voice
   - affect fail (too high arousal) → lower expressiveness controls, choose calmer voice prior
   - quality fail → increase decode quality / post-fx / loudness normalization
4) Keep the best-scoring attempt; emit an `AudioProof` describing all attempts.

This turns “emotion control” into an empirical, measurable system instead of vibes.

---

## 9) Policy, safety, and licensing (must-not-fail)

### 9.1 Voice impersonation / cloning

Audio is uniquely abuse-prone. bb-ui MUST provide a host-controlled policy layer:

- `voiceCloningAllowed: false` by default
- if enabled, require explicit consent tracking and allowlist of targets

### 9.2 Voice catalog + license gating

Treat voices as licensed assets:

- `voiceId` must resolve to a catalog entry with a known license tag.
- allowlist permissive licenses by default; block non-commercial licenses unless explicitly enabled.

### 9.3 Evidence-first posture

Every audible output should carry evidence refs:

- TTS model + version/hash
- voice id + license tag
- control parameters + seed
- verification gate scores
- content hash of the produced audio artifact

---

## 10) “Play around with Pocket TTS” (practical experimentation plan)

Constraints:

- In this repo’s sandbox environment, network is unavailable, so model download/installation can’t be verified here.
- Treat the steps below as a suggested workflow; confirm exact CLI/API details from upstream docs.

Suggested workflow:

1) Choose 2–3 permissively licensed voices (and record their licenses in a local `VoiceCatalog`).
2) Define a tiny calibration prompt set:
   - neutral, excited, concerned, relieved
3) Sweep controllable knobs (where available):
   - temperature/sampling
   - punctuation strategy
   - voice presets
4) Run SER on outputs, compute `(errV, errA)` vs your targets.
5) Store the best “preset table” in a machine-readable artifact used by the Audio Planner.

Deliverable: a calibration report + an allowlisted voice catalog, so the system’s affect control becomes reliable and auditable.

---

## 11) bb-ui surface (implemented)

Audio entrypoint:

- `@backbay/bb-ui/audio`

Key interfaces:

- `SpeechSynthesisProvider` (generate/stream speech)
- `AudioVerifier` (quality + ASR + SER; produces `AudioProof`)
- `VoiceCatalog` (license-aware allowlist)

Architecture A (modular “truth lane”) hooks:

- `useSpeechSynthesis` (plan → synthesize → optional verify → play, with barge-in cancel)

Architecture C (hybrid overlay) hooks:

- `useAudioOverlay` (short overlay speech tokens: `ack/hold/done/error/warning`)
- `useHybridSpeech` (runs overlay + main lanes; includes `speakWithAck`)
- `useRunSpeechCues` (optional convenience: map run status → overlay cues)

Cognition integration output (conceptual):

- `speechPlan` (voice + params + target AVO + evidence)
- `audioTokens` (earcons, ambience, music parameters)

---

## 12) References (repo-grounded)

- Cognition + persona drift: `docs/cognition-system.md` and `/Users/connor/Medica/glia-fab/research/2601.10387v1.pdf`
- Verification-first proofs: `/Users/connor/Medica/glia-fab/research/aegis-net-agentic-fabs/paper.md`
- Adaptive audio research: `/Users/connor/Medica/glia-fab/research/audio-engine/cyntra-audio-research.md`
- Audio engine architecture: `/Users/connor/Medica/glia-fab/research/audio-engine/ARCHITECTURE.md`

---

## Appendix A) What’s “cutting edge” (2026) + transport choices

This appendix summarizes the best current ingredients for a real-time, verifiable audio cognition stack.

### A.1 Speech models: “speech-to-speech” is the frontier

The most “cutting edge” direction for interactive voice agents is **full-duplex speech-to-speech** generation:

- It removes the classic `VAD → ASR → text LLM → TTS` pipeline boundary.
- It supports **overlapping speech, interruptions, and interjections** as a first-class dynamic.
- It preserves non-linguistic cues (emotion, timing, non-speech sounds) better than text-only intermediates.

Concrete open reference:

- Kyutai Moshi: https://github.com/kyutai-labs/moshi (paper: arXiv 2410.00037)

### A.2 TTS models: fast + controllable + easy to host

For product-grade TTS where you still want a modular pipeline:

- Pocket TTS (CPU-friendly, streaming, ~100M params): https://huggingface.co/kyutai/pocket-tts
  - Note: Kyutai provides a “without voice cloning” variant for easier access: https://huggingface.co/kyutai/pocket-tts-without-voice-cloning
- Kyutai’s larger TTS (1.6B, real-time oriented): https://kyutai.org/tts

### A.3 Verification + trust: watermarking is becoming table-stakes

If you care about verification and future provenance, embed a watermark in generated speech and record detection outputs in `AudioProof`:

- AudioSeal (localized audio watermarking, streaming support): https://github.com/facebookresearch/audioseal

### A.4 “Emotion validation” needs more than SER

To make emotion validation credible, stack multiple, orthogonal checks:

1) Affect alignment (SER VAD vs target AVO)  
2) Semantic correctness (ASR transcript vs intended text)  
3) Speaker/voice consistency (speaker verification embeddings)  
4) Anti-spoof/deepfake detection on incoming audio when relevant

Useful open pieces:

- SpeechBrain speaker verification model (`spkrec-ecapa-voxceleb`): https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb
- ASVspoof 2021 (countermeasure benchmark + datasets/keys): https://www.asvspoof.org/index2021.html

### A.5 Do we need LiveKit?

No—LiveKit is a **transport/infrastructure choice**, not a requirement for audio cognition.

Pick based on your needs:

- **Just streaming TTS to one browser tab:** don’t use WebRTC at all; HTTP streaming or WebSocket PCM/Opus chunks can be enough.
- **Real-time duplex voice (mic up + TTS down) with barge-in and good latency:** WebRTC is the pragmatic default.
  - LiveKit is a strong option and is open-source + self-hostable: https://github.com/livekit/livekit and https://docs.livekit.io/transport/self-hosting/
  - mediasoup is a common alternative SFU building block: https://mediasoup.org/documentation/overview/

“Cutting-edge” transport notes:

- WebTransport (HTTP/3) is compelling, but Safari support is still a blocker for broad deployment; plan a fallback if you experiment with it:
  - https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
  - https://caniuse.com/webtransport

---

## Appendix B) Elite path (recommended build plan)

You said you’re happy to self-host and/or RL your own models. The “elite” path is to treat audio as a **verifiable production pipeline** with a fast real-time lane and a slower verification+calibration lane.

### B.1 Phase 1: Self-hosted modular voice (ship fast, instrument everything)

Build a local/hosted `bb-audio` service (Python or Rust) with:

- **Synthesis**: Pocket TTS (or your own TTS) streaming output.
- **Capture**: optional mic input ingestion for duplex voice.
- **Verification**: quality + ASR + SER (+ optional watermark detect).
- **Proof**: emit `AudioProof` per utterance (`docs/schemas/audio-proof.schema.json`).

bb-ui stays thin:

- `AudioPlanner`: pure mapping `CognitionState + text → SpeechPlan + AudioTokens`.
- `Playback`: stream audio + support barge-in/cancel.
- `Policy clamps`: `safetyMode`, `trustTier`, license allowlist, voice cloning off-by-default.

Key “elite” property in Phase 1: everything has a `traceId` and yields a proof bundle.

### B.2 Phase 2: Closed-loop “generate until it verifies” (quality leap)

Turn the verifier into a controller:

1) generate with an initial `SpeechPlan`
2) verify (quality/semantic/affect)
3) if fail, apply a small deterministic adjustment policy and retry (bounded N)
4) store all attempts and pick the best-scoring one

This makes affect control measurable and stable across voices and updates.

### B.3 Phase 3: Full-duplex speech-to-speech (true cutting edge UX)

Once you want “real conversation” (interruptions, overlap, natural timing), add a speech-to-speech lane:

- speech-to-speech model produces outbound audio directly from inbound audio + state
- keep a **text lane** in parallel for safety and reasoning transparency (ASR transcript + policy)

Verification still applies:

- ASR the outbound audio and compare to intended meaning (or to a constrained textual plan)
- SER-check affect alignment
- watermark generated audio (when feasible) and record detection in `AudioProof`

### B.4 Phase 4: RL / learning (make it better every day)

Don’t start by RL’ing giant models; start by learning the **planner policy**:

- Inputs: cognition signals (`mode`, `risk`, `personaDriftRisk`, `emotionAVO`, etc.)
- Actions: choose `voiceId`, `preset`, punctuation strategy, sampling controls, speaking rate (where supported)
- Reward: verifier scores + user feedback + “cross-modal consistency” score

When the planner is strong and stable, you can consider:

- fine-tuning prosody controls / conditioning
- eventually RL/tuning a speech-to-speech model (with strict safety constraints)

---

## Appendix C) Transport + hosting choices (no “must use LiveKit”)

Pick transport to match the product:

### C.1 One user, TTS-only, simple

- Use **HTTP streaming** or **WebSocket** audio chunks (PCM/WAV for simplicity, Opus for efficiency).
- Pros: easiest to implement and debug.
- Cons: not ideal for real-time duplex voice and network jitter handling.

### C.2 Duplex voice + barge-in (recommended default)

- Use **WebRTC**.
- You can self-host:
  - LiveKit (SFU + infra): https://github.com/livekit/livekit
  - mediasoup (SFU building block): https://mediasoup.org/documentation/overview/

LiveKit is not required; it’s just a practical packaging of the WebRTC stack.

### C.3 Multi-party, world audio, spatial mixes

- Use WebRTC + SFU if you need multiple sources and low-latency mixing/routing.
- Keep “cognition” and “verification” in your `bb-audio` service; treat SFU as transport only.
