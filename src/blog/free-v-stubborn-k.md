---
title: "free v, stubborn k"
date: 2026-05-05
tags: ["research", "kv-cache", "quantization", "transformers", "hybrid-models"]
summary: "tried to build a better kv-cache compressor. the compressor stuff didn't land. the geometry under it did. n=8 spectral profile, plus one weird hybrid result we couldn't follow up on."
---

this is the partner post to [what's under the cosine](/blog/whats-under-the-cosine). the carrier work in that post grew out of a different project we'd been on for months: kv-cache compression for [tom turney's turboquant+](https://github.com/TheTom). that project ended up not finding the win we hoped for. but the geometry we built up to look at it survived intact, fed the carrier work, and produced one cross-model observation we still can't fully explain.

so this is the writeup the carrier post owed.

## what we set out to do

[turboquant](https://arxiv.org/abs/2504.04658) (google research, ICLR 2026) compresses kv cache via walsh-hadamard rotation followed by polar quantization. tom's [turboquant+](https://github.com/TheTom/turboquant_plus) extends it with asymmetric k/v treatment, turbo kernels for metal and CUDA, and a llama.cpp fork that we used as the working harness. on qwen2.5-7b q8_0 at 32k context, the baseline stack compresses the f16 kv footprint from ~1.8 gb to ~690 mb (2.6×) at 0.55% perplexity cost. that's the thing we were trying to push further.

the bet: maybe per-head spectral structure could let us beat uniform tq quantization with non-uniform bit allocation. spectralquant ([arxiv 2402.09221](https://arxiv.org/abs/2402.09221) and the [spectralquant repo](https://github.com/spectralquant)) had already shown that effective dimensionality `d_eff` is small for keys (~4) and that data-driven rotations followed by 2-tier quantization can beat tq on llama-2 / qwen-2.5-1.5b. our pitch was that a 3-tier extension using the gap between *centered* and *uncentered* `d_eff` would beat 2-tier — capturing a "medium importance" tier of dimensions that 2-tier collapses into the noise tier.

that's the high-level plan we were on for ~6 weeks. data-driven k rotation, three-tier bit allocation, plug into tom's c++ harness, win.

## what didn't land

a clean chain of negatives.

**pca dimension pruning**: the original idea was simpler — truncate keys to a smaller dimension, save bits straightforwardly. the JL lemma said this should be fine for pairwise distance preservation. it was catastrophic in practice. on 8 layers of pca-pruned k on llama-3.2-1b, ppl went up by 552%. the problem is each pruned layer shifts the residual stream's geometry for the next layer's pca basis, and errors compound. JL preserves *pairwise* distances; what attention needs is *q-k* dot product preservation across an entire downstream stack. those are different requirements, and we conflated them. we deprecated the whole pca-pruning track.

**spectralquant 3-tier on heldout**: this was the main bet. we built a clean replication of sq's exp1 (attention-weight cosine, uniform quant, mean subtraction, both `same` and `heldout` splits) and added a 3-tier compressor using the gap between `d_eff_uncentered` (~4) and `d_eff_centered` (~38) as tier boundaries. on `same` split — where calibration and evaluation share data — 3-tier showed a small win at 2.5 bits. on `heldout` split, the win flipped: at 2.5 bits, sq 2-tier slightly beat our 3-tier. at 3.0 and 2.0 bits, the two were tied within noise. 3-tier was a same-split overfit, not a real win.

**centered-V variant**: we noticed that sq's design uses uncentered eigenvectors but does mean subtraction at compression time. for sink-style models, this means the top-1 eigenvector ≈ mean direction, and after mean subtraction the high-bit signal tier has a near-zero dim wasting bits. the obvious fix: use centered eigenvectors. we tried it. ties or slightly underperforms vanilla sq on both splits, both bit levels. the wasted-bit-on-mean-direction story is real geometry; it's not a practical compression lever.

**SQ vs TQ on a per-head metric**: looking at sq's own released results carefully, their `proper_comparison.json` on qwen2.5-1.5b reports `sq_mean = 0.8306` vs `tq_mean = 0.8424`, with `win_rate = 0.42` for sq. independently, our heldout result corroborates this: sq doesn't reliably beat tq on this model. so the original spectralquant claim that motivated 3-tier (sq beats tq, we can beat sq) was already shakier than we thought going in.

after two months of variants, the honest summary was: no clear compressor win. tom's existing q8_0-K + turbo3-V is hard to improve on with the things we tried.

## what survived

the per-head spectral profiler we built for all of this is what survived. one script, eight models, full per-head per-layer eigendecomposition of post-rope k and v. data-driven rotations saved per-head. fp32 inline calibration. we ran it on:

- qwen2.5 {1.5b, 3b, 7b}
- qwen3-4b
- gemma-3-1b
- mistral-7b-instruct-v0.3
- LFM-2.5-1.2b (hybrid)
- qwen3.5-4b (hybrid)

n=8 dense + n=2 hybrid. and across that set, two cross-model facts came out clean.

### v is wider than k, every model

per-head participation ratio `d_eff = (Σλ)² / Σλ²` measures how concentrated a head's variance is across head-dim. low `d_eff` = a few dimensions dominate. high `d_eff` = variance is spread.

| model | k d_eff_uc | k d_eff_c | v d_eff_uc | v d_eff_c | asym (uc) |
|---|---:|---:|---:|---:|---:|
| gemma-3-1b | 4.45 | 25.58 | 25.38 | 51.15 | 5.7× |
| mistral-7b | 4.13 | 38.70 | 41.19 | 50.49 | 10.0× |
| qwen2.5-1.5b | 4.51 | 38.03 | 31.57 | 46.13 | 7.0× |
| qwen2.5-3b | 4.96 | 39.01 | 34.10 | 45.87 | 6.9× |
| qwen2.5-7b | 4.78 | 37.20 | 41.56 | 51.03 | 8.7× |
| qwen3-4b | 5.30 | 30.76 | 35.92 | 47.10 | 6.8× |
| **lfm-2.5-1.2b (hybrid)** | **10.86** | 24.97 | 26.91 | 33.09 | **2.5×** |
| **qwen3.5-4b (hybrid)** | **11.46** | 36.64 | 22.84 | 64.69 | **2.0×** |

`uc` is uncentered, `c` is centered. dense k `d_eff_uc` clusters tightly at 4-5. dense v `d_eff_uc` is 25-41. v / k uncentered ratio on dense models is 5.7× to 10×. v / k centered is much smaller, 1.2× to 2×.

![cross-model k/v dumbbell — dense models cluster k at 4-5, hybrid k sits at 10-11](/blog/images/free-v-stubborn-k/dumbbell.png)

most of the asymmetry is in the *uncentered* view, not the centered view. that's because dense k has a strong mean direction (a sink, in the [cancedda 2024](https://aclanthology.org/2024.acl-long.263/) sense — see the carrier post for that thread) that dominates the uncentered spectrum but vanishes after mean subtraction. dense v doesn't have this; v's energy is genuinely spread across many dimensions both before and after centering.

this all corroborates tom's "v is free, k is everything" position. independent n=8 cross-family check. the practical implication — q8_0 keys + turbo3 values is sound design — was already his recommendation. we're not adding anything to that conclusion.

### hybrid k geometry is structurally different

this is the only finding in the whole kv arc that we'd call "we didn't expect this".

dense k `d_eff_uc` is 4-5 across every dense model in the table. hybrid k (LFM-2.5 and qwen3.5-4b) is 10-11. that's a 2× difference in the same column. and the asymmetry collapses too: dense v/k uncentered ratio is 6-10×, hybrid is 2-2.5×.

interpretation, with caveats: in dense attention, k tends to develop the cancedda-style massive-activation sink — a few specific channel directions that absorb attention mass on bos / first-position tokens. that's what the low `d_eff_uc` reflects. hybrid models (LFM has [LIV-conv](https://www.liquid.ai) blocks interleaved with attention; qwen3.5 has [DeltaNet](https://arxiv.org/abs/2406.06484) interleaved) seem to not develop this single-sink k geometry. their k is spread across more directions even before centering.

we documented this as an observation worth pinning down further but ran out of road. we tried three more hybrid families (recurrentgemma, zamba2, hymba) on apple silicon to extend the n=2 → n=5 case. all three failed to load:

- **recurrentgemma**: griffin architecture; HF wrapper doesn't expose `past_key_values` for the local-attention layers
- **zamba2**: hits a transformers library bug on tied-weights validation for its shared-block architecture
- **hymba**: requires `causal_conv1d`, `mamba_ssm`, `flash_attn` — all CUDA-only on PyPI

so the hybrid k observation stays at n=2 in this writeup. the structural finding ("hybrid k has different spectral geometry from dense k") is real on the two models we have. whether it generalizes across mamba+attention, deltanet, hyena, samba, jamba, etc — completely open.

this is the thread that still feels like it has more to give. someone with cuda access and the patience to sit through 5-6 hybrid model loads could close it cleanly.

## why this fed the carrier work

building the per-head spectral profiler taught us how to do this kind of analysis. when [muyu he](https://x.com/HeMuyu0327) posted [his thread](https://x.com/HeMuyu0327/status/2048615865222938972) on adjacent-layer cosine being a misleading layer-utility metric, the same toolkit dropped almost verbatim onto residual stream activations. the centered/uncentered participation ratio split, the per-head structure analysis, the mean-direction story — all of it transferred. the carrier post is the continuation.

so this is one of those projects where the original goal wasn't reached but the secondary infrastructure became the primary output. we set out to build a better k/v compressor. we ended up with a cross-family residual-stream geometry case study that's getting more interest than the compressor work ever would have. that's just how research goes sometimes.

## what we'd do differently

honestly, mostly the same. some specific things we'd skip:

- **the pca pruning bench** ate two weeks. should have noticed earlier that it conflated jl-style pairwise preservation with the q-k dot product preservation that attention actually needs. the math was clear in retrospect.
- **the SQ 3-tier ablation on `same` split** got us excited about a non-result. we should have done heldout first. we now keep "always heldout for a calibration-vs-eval evaluation" as a rule.
- **the centered-V variant** was a 1-day experiment that we let stretch over a week. when an obvious-feeling fix doesn't work in 2-3 runs, don't keep tuning hyperparams.

things we'd push harder on:

- **the hybrid k thread**, with cuda access. n=2 isn't enough. the obvious next step is recurrentgemma + zamba2 + samba + hymba on a linux gpu box.
- **why** dense k develops the sink and hybrid k doesn't. is it an architecture-determined inductive bias of softmax attention? does it require the specific k-projection-then-rope geometry that hybrid models don't all have? we have the symptom; we don't have the mechanism.
- **methodology audit of sq's own results**. their `same` split is the default in their public exp1. it's the wrong default. small thing to flag if interacting with that codebase.

## limits

- n=8 dense + n=2 hybrid. apple silicon only. wikitext-2 calibration only.
- no causal grounding for the k/v geometry — the carrier post does that for residual stream; we never ran the equivalent intervention test on k or v.
- no compressor result to ship. q8_0-k + turbo3-v remains the recommended config.
- the hybrid k difference is plausibly real but the sample size doesn't carry it past "interesting case study, not a generalization."

## references

- [turboquant — google research, ICLR 2026](https://arxiv.org/abs/2504.04658)
- [turboquant+ — tom turney](https://github.com/TheTom/turboquant_plus) — production stack with asymmetric k/v
- [turboquant+ asymmetric-kv-compression doc](https://github.com/TheTom/turboquant_plus/blob/main/docs/papers/asymmetric-kv-compression.md) — "v is free, k is everything"
- [turboquant+ layer-aware-v-compression doc](https://github.com/TheTom/turboquant_plus/blob/main/docs/papers/layer-aware-v-compression.md) — boundary v policy + hybrid caveat
- [spectralquant — arxiv 2402.09221](https://arxiv.org/abs/2402.09221)
- [spectralquant repo](https://github.com/spectralquant)
- [cancedda 2024 — spectral filters, dark signals, attention sinks (ACL long)](https://aclanthology.org/2024.acl-long.263/)
- [johnson-lindenstrauss exploration — nick yoder](https://nickyoder.com/johnson-lindenstrauss/) — original repo this work started from

*code, data, full memos: [Ja-Crispy/Johnson-Lindenstrauss @ research/residual-carriers](https://github.com/Ja-Crispy/Johnson-Lindenstrauss/tree/research/residual-carriers). the kv-asymmetry memo is in `docs/kv_asymmetry_memo.md`; the bench a null is in `docs/bench_v2_findings.md`.*
