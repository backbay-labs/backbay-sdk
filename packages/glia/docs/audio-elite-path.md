# bb-ui Audio “Elite Path” (Research + Comprehensive Spec)

Status: draft  
Owner: bb-ui  
Last updated: 2026-01-20  

This document is the “research-backed, super comprehensive” elite path for audio cognition and verification. It complements:

- `docs/cognition-system.md` (headless cognition + persona drift signals)
- `docs/audio-cognition.md` (audio planner + verification overview)
- `docs/schemas/audio-proof.schema.json` (proof bundle schema)

---

## 0) North Star

An elite audio system for agents is:

1) **Low-latency and interruption-native** (barge-in feels natural).
2) **Cross-modal coherent** (voice affect matches visuals/text).
3) **Verification-first** (every utterance ships with a proof bundle and passes gates by default).
4) **Self-hostable** (you control privacy, policy, and cost curves).
5) **Continuously improving** via data + calibration + RL on the *planner*, not “vibes”.

---

## 1) Cutting-edge landscape (what’s actually frontier)

### 1.1 Full-duplex speech-to-speech (S2S) is the frontier interaction model

The biggest UX jump comes from **speech-to-speech generation** where overlapping speech and interjections are modeled directly (instead of forced turn segmentation). A concrete open reference is Kyutai’s Moshi: https://github.com/kyutai-labs/moshi and paper https://arxiv.org/abs/2410.00037.

Key ideas to steal even if you don’t adopt the model:

- Treat dialogue as **two parallel audio streams** (user + agent), enabling overlap.
- Use a **streaming neural codec** so the model operates in audio-token space; Moshi uses Mimi (see §2.2).
- Use “inner monologue” (predict aligned text tokens in parallel) to improve linguistic quality while retaining direct audio control.

### 1.2 Verification-first audio is becoming table-stakes (watermark + detection)

If you plan to ship synthetic speech, embed watermark + detect it:

- AudioSeal (streaming support, MIT license): https://github.com/facebookresearch/audioseal

This plugs directly into `AudioProof` as an additional gate (`watermark`) and as provenance metadata.

### 1.3 Emotional/expressive TTS is now promptable and multi-voice

If you want modular TTS (not end-to-end S2S), there are strong open systems with explicit “emotion” instructions:

- CosyVoice (bi-streaming, instruction support): https://github.com/FunAudioLLM/CosyVoice
- EmotiVoice (prompt-controlled emotional synthesis): https://github.com/netease-youdao/EmotiVoice
- OpenVoice (voice cloning + style control; MIT): https://github.com/myshell-ai/OpenVoice

You should still keep **voice cloning disabled by default** at the product layer (policy) even if the model can do it.

### 1.4 Streaming ASR has jumped (speed + timestamps + punctuation)

For verification (semantic gate) and for duplex UX, you want a strong streaming ASR with timestamps:

- NVIDIA NeMo ASR “Parakeet” family supports chunked/streaming inference, incl. Parakeet-TDT-0.6B V2: https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/asr/models.html

This is valuable even if you adopt S2S: you still want transcripts for safety, debugging, and evidence.

### 1.5 “Omni” models with real-time speech output are now open-weight

A major recent development is end-to-end **omni-modal LLMs** that can take **audio input** and generate **streaming natural speech** directly, while still supporting strong text reasoning:

- Qwen2.5-Omni (repo + technical report): https://github.com/QwenLM/Qwen2.5-Omni and https://arxiv.org/abs/2503.20215
- Qwen3-Omni (repo): https://github.com/QwenLM/Qwen3-Omni

Why this matters for the “elite path”:

- It’s a practical bridge between modular pipelines and pure S2S: you can keep a text lane for tools/safety while having native speech I/O.
- Qwen2.5-Omni explicitly describes a **Thinker–Talker** split (text generation vs audio token generation) that aligns with our “planner + verifier” architecture and with the need for an auditable text trace.

---

## 2) Recommended reference architectures (choose one)

### 2.1 Architecture A: Modular (VAD → ASR → LLM → TTS) + elite verification (best “ship now”)

Use when:

- You want to move fast and keep the cognition/text stack as the source of truth.
- You need clear safety boundaries and auditable text plans.

Core modules:

1) Capture: VAD, endpointing, AEC/noise suppression.
2) ASR: streaming transcript + timestamps.
3) Cognition: `CognitionState` drives an `AudioPlanner`.
4) TTS: streaming audio generation.
5) Verifier: quality + semantic + affect + watermark (+ optional anti-spoof / speaker consistency).
6) Proof: `AudioProof` per utterance.

### 2.2 Architecture B: Full-duplex S2S + parallel text lane (best “endgame UX”)

Use when:

- You want the “real conversation” feel (overlap, interjections).
- You can afford a more complex safety+verification story.

Core modules:

1) S2S model generates agent audio tokens directly (and optionally “inner monologue” text).
2) A parallel transcript lane: ASR the agent output audio to produce a textual trace.
3) Same verifier + `AudioProof` pipeline as modular.

Why the text lane matters even in S2S:

- Evidence and debugging.
- Safety checks and semantic regression tests.
- Cross-modal consistency with UI text.

### 2.3 Architecture C: Hybrid (modular baseline + S2S “overlay”)

Start modular for reliability, then introduce S2S for micro-UX:

- interjections (“mm-hm”, “one sec”, “got it”)
- reactive earcons or short spoken acknowledgements
- better overlap handling

### 2.4 Architecture D: Omni voice LLM + explicit verification (best “single-model lane”)

Use when:

- You want “audio in / audio out” without stitching ASR+TTS together.
- You still want proof bundles, safety rails, and cross-modal coherence.

Pattern:

1) Omni model produces streaming speech output.
2) Run the same verifier stack:
   - ASR the *output* audio for semantic receipts.
   - SER-check affect alignment (optionally).
   - watermark detect/embed (if used).
3) Emit an `AudioProof` as the evidence envelope.

This gives you most S2S benefits while preserving verification posture.

### 2.5 Decision matrix (what to pick first)

If the goal is “elite” *and* shippable, a practical progression is:

- Start with **Architecture A (modular)** if you need maximum auditability and fast iteration on cognition/policy.
- Move to **Architecture C (hybrid)** to get natural acknowledgements/interjections while keeping text as the source of truth.
- Adopt **Architecture B (full-duplex S2S)** or **D (omni)** only after your verification + policy stack is solid, because debugging and safety are harder without a strong textual plan lane.

---

## 3) Transport choices (you do NOT need LiveKit)

LiveKit is a WebRTC product/infrastructure stack. It’s optional.

### 3.1 TTS-only streaming

If your only requirement is “play agent speech in the browser”:

- HTTP streaming or WebSocket audio chunks are enough.
- Simpler to debug and operate than WebRTC.

### 3.2 Duplex voice (mic up + speech down) with barge-in

If you want bidirectional, low-latency audio with jitter control:

- WebRTC is the pragmatic default.
- You can self-host:
  - LiveKit (open-source SFU): https://github.com/livekit/livekit
  - mediasoup (SFU building block): https://mediasoup.org/documentation/overview/

If you avoid WebRTC, you must re-implement important pieces:

- echo cancellation (AEC)
- jitter buffering and packet loss concealment
- device capture ergonomics

### 3.3 WebTransport / HTTP/3 (experimental)

WebTransport is promising for low-latency data streams but isn’t universally supported; plan fallbacks:

- https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
- https://caniuse.com/webtransport

### 3.4 Audio formats and codecs (practical defaults)

Separate concerns:

- **Model I/O**: many speech models operate naturally at 16–24kHz mono PCM (float or int16).
- **Transport**:
  - PCM chunks are simplest for prototyping but bandwidth-heavy.
  - Opus is the practical default for low-latency speech over networks.
- **Archival**: store WAV/FLAC plus hashes for evidence, even if you transport Opus.

---

## 4) Component “elite stack” (self-hostable defaults)

Below is a recommended “best available open” stack you can host today.

### 4.1 Capture + turn-taking primitives

- VAD: Silero VAD (MIT): https://github.com/snakers4/silero-vad
- Optional open reimplementation wrapper: https://github.com/stefanwebb/open-voice-activity-detection

Required for elite feel:

- endpointing tuned for barge-in (fast stop)
- state machine for “agent is speaking” vs “user is speaking” vs “overlap”

### 4.2 Diarization (multi-speaker tracking)

If you want call/meeting-style cognition or multi-agent spaces:

- pyannote “community-1” diarization: https://huggingface.co/pyannote/speaker-diarization-community-1
- pyannoteAI announcement: https://www.pyannote.ai/blog/community-1

### 4.3 ASR (semantic verification + transcripts)

- NVIDIA NeMo Parakeet family (streaming): https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/asr/models.html

### 4.4 TTS / S2S generation

Modular TTS:

- Pocket TTS (Kyutai): https://huggingface.co/kyutai/pocket-tts
- CosyVoice: https://github.com/FunAudioLLM/CosyVoice
- EmotiVoice (emotion prompts): https://github.com/netease-youdao/EmotiVoice

Voice cloning (optional, default disabled):

- OpenVoice (style control; MIT): https://github.com/myshell-ai/OpenVoice

Full-duplex S2S:

- Kyutai Moshi + Mimi codec: https://github.com/kyutai-labs/moshi

### 4.5 Neural audio codec (for S2S / audio-token pipelines)

Moshi uses Mimi, a streaming neural audio codec (24kHz, streaming, low bitrate). Details in Moshi repo:

- https://github.com/kyutai-labs/moshi

### 4.6 Affect verification (SER) + calibration

SER is noisy; treat it as one gate among several. Still, it’s useful for “don’t ship jarring affect”.

You already have MERaLiON SER in `docs/audio-cognition.md`. Add calibration datasets (see §6.3).

### 4.7 Voice consistency + anti-spoof (abuse + authentication)

If the product uses voice as identity or if you accept incoming audio as evidence, add:

- Speaker verification embeddings (SpeechBrain ECAPA): https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb
- Anti-spoof baseline research: ASVspoof 2021 baselines: https://github.com/asvspoof-challenge/2021
- AASIST (MIT): https://github.com/clovaai/aasist

### 4.8 Watermarking (provenance)

- AudioSeal (streaming): https://github.com/facebookresearch/audioseal

### 4.9 Quality scoring (automate “sounds good”)

Add a MOS predictor as an auxiliary metric:

- SpeechMOS (UTMOS predictors; MIT): https://github.com/tarepan/SpeechMOS

MOS does not replace humans, but it’s extremely useful for regression and automatic comparisons.

### 4.10 Multilingual speech and translation (optional)

If you want multilingual voice UX (speech translation, ASR across languages), Meta’s SeamlessCommunication project is a strong open reference:

- https://github.com/facebookresearch/seamless_communication
- https://arxiv.org/abs/2308.11596

---

## 5) Verification-first pipeline (what “elite” means operationally)

Every utterance yields an `AudioProof` and runs gates.

### 5.1 Gate set (recommended)

Baseline (already in `docs/audio-cognition.md`):

- `quality`: clipping/headroom, loudness, duration sanity, format normalization
- `semantic`: ASR transcript similarity + keyword safety checks
- `affect`: SER VAD vs target AVO (calibrated tolerances)
- `multimodalConsistency`: audio affect vs UI affect (optional)

Elite add-ons:

- `watermark`: watermark present + decode message (if used)
- `speakerConsistency`: similarity to allowed speaker profile (if applicable)
- `antiSpoof`: incoming audio deepfake detection (if applicable)
- `mos`: predicted MOS > threshold (for regression gating; not a hard ship gate early)

Schema extension is supported by adding optional gates to `docs/schemas/audio-proof.schema.json`.

### 5.2 Closed-loop “generate until it verifies”

The most important engineering trick for elite behavior:

- Treat generation as stochastic and *verification as truthy*.
- Retry with bounded attempts and deterministic adjustment policy.

This makes affect control and quality consistent across voices and updates.

### 5.3 Auditability

Store:

- hashes of audio artifacts
- model/voice identifiers and revisions
- gate metrics
- a short trace of planner decisions (`SpeechPlan` revisions)

You should be able to answer: “why did the agent sound like that?” with receipts.

### 5.4 Determinism and replay (critical for serious RL + regressions)

For every generation attempt, record enough to reproduce or at least compare deterministically:

- model id + revision
- voice id + license
- decoding controls and seed
- audio artifact hash
- verifier model ids/versions

Even if the model isn’t strictly deterministic, this gives you stable regression signals and comparable evidence bundles.

---

## 6) Data + evaluation plan (how you avoid delusion)

### 6.1 Metrics

Latency:

- end-to-end: mic → agent audio start (P50/P95)
- barge-in: user speech start → agent audio stop

Accuracy:

- ASR WER (for semantic gate quality)
- semantic match rate for safety-critical tokens

Audio quality:

- clipping / loudness compliance
- MOS predictor trends (regression)

Affect:

- SER V/A error distributions per voice + prompt class
- cross-modal disagreement rate (audio vs visuals)

### 6.2 “Scenario traces” (regression suite)

Create scenario traces like you do for cognition:

- “happy path explanation”
- “error + recovery”
- “user interruption + redirect”
- “vulnerable user disclosure” (forces safe mode + gentle voice)
- “high-risk action requires confirmation”

Each scenario should assert:

- final cognition mode
- selected speech plan constraints (e.g., safety clamp)
- verification gates pass and produce an `AudioProof`

### 6.3 Calibration datasets (emotion + spoof intersections)

Emotional synthesis interacts with spoof detection and SER. Useful dataset reference:

- EmoSpoof-TTS dataset (includes StyleTTS2, CosyVoice, F5-TTS): https://emospoof-tts.github.io/Dataset/

You can build an internal calibration set:

- fixed prompt list × target AVO × voiceId
- run TTS
- run SER and compute error distributions
- set tolerances per voice and per mode

---

## 7) RL plan (start small, win big)

### 7.1 RL the planner first (recommended)

Start with a `SpeechPlanPolicy` that chooses:

- `voiceId`/preset
- sampling controls (temperature, etc.)
- punctuation / phrasing strategy
- speaking rate controls (if supported)

Reward:

- verifier score (weighted sum)
- user feedback (thumbs up/down, “too chipper”, “too robotic”)
- penalty for latency/cost and for retries

This is usually a contextual bandit / offline RL problem and is far easier than RL’ing a big S2S model.

### 7.2 Then learn “affect control maps”

Learn per-voice mappings from target AVO to model controls:

- treat it as supervised regression or Bayesian optimization
- bake results into a versioned calibration table used by the planner

### 7.3 Only then consider model fine-tuning / S2S tuning

If you later tune models:

- keep hard safety constraints at the policy layer
- always evaluate against the same verification suite + scenario traces
- require watermark + provenance for generated outputs

---

## 8) Safety + policy + licensing (elite bar)

Minimum requirements:

- Voice cloning off by default; explicit allowlist + consent tracking to enable.
- License-aware voice catalog; production defaults to permissive licenses only.
- Store and surface provenance: model id/revision, voice id, watermark status.
- If voice is used for authentication or high-trust flows, require anti-spoof checks.

---

## 9) How this plugs into bb-ui cognition

bb-ui provides the *planning signal surface*:

- `mode`, `risk`, `confidence`, `personaDriftRisk`, `emotionAVO`, etc.

The elite audio system provides:

- `SpeechPlan` + audio tokens (earcons/music params)
- `AudioProof` receipts
- backpressure signals (“verification slow”, “ASR uncertain”, “barge-in detected”)

All of this can be fed back into cognition as events:

- `audio.verification_failed` → raise `risk` + clamp style
- `audio.barge_in` → `mode=listening`
