---
title: "what's under the cosine"
date: 2026-04-30
tags: ["research", "interpretability", "residual-streams", "attention-sinks", "metrics"]
summary: "ran a small cross-family case study on dense transformers. adjacent-layer cosine has a carrier-dependent failure mode. so does CKA. the interesting object isn't the metric; it's what's underneath."
---

[muyu he](https://x.com/HeMuyu0327) posted [a thread on x](https://x.com/HeMuyu0327/status/2048615865222938972) arguing that adjacent-layer cosine similarity is a bad proxy for "how much a layer is being utilized". the kind of plot you see in the [curse of depth paper](https://arxiv.org/abs/2502.05795) where layers that look highly similar are flagged as wasted depth. his three points:

1. cosine angles conflate cancellation and orthogonality. neither necessarily means useful work.
2. angle is direction-blind. two transitions with the same angle can rotate in totally different bases.
3. a few dominant dimensions can dominate the metric and hide important sub-dominant directions.

we'd been working on something else. kv cache compression for [tom turney's turboquant+](https://github.com/TheTom/turboquant_plus), some [JL-lemma](https://nickyoder.com/johnson-lindenstrauss/)-flavored geometry for keys, a memo on dense vs hybrid k/v asymmetry. the spectral toolkit we'd built (per-head participation ratios, centered/uncentered decomposition) turned out to apply almost verbatim to the layer-utility question. so we ran a small cross-family case study on residual-stream activations. n=3 dense models. apple silicon. one focused session.

the short version: muyu's right, but in a more model-dependent way than "cosine is bad". cosine has a carrier-dependent failure mode. CKA has a different carrier-dependent failure mode. the thing worth looking at is the carrier, not the metric.

## the setup

three dense models on m5 max, fp32 forward:

- qwen2.5-1.5b
- gemma-3-1b-it
- mistral-7b-instruct-v0.3

8 wikitext-2 sequences × 512 tokens each, 4096 total positions per layer. for each layer's hidden states `h_l` (shape `(N, D)` after concatenation across sequences) we compute:

- **uncentered participation ratio**: `d_eff_uc = (Σλ)² / Σλ²` on `X^T X`. measures concentration including any dominant mean direction.
- **centered participation ratio**: same on `(X - mean)^T (X - mean)`. measures variance structure beyond the mean.

participation ratio is the right tool here because it's intra-tensor, not pairwise. it sidesteps muyu's points 1 and 3 directly: cancellation/orthogonality concerns don't apply (it's a spectrum concentration measure, not a relation between two vectors), and dominant dimensions show up as small d_eff rather than getting averaged into the answer.

code: `scripts/analyze_carrier_structure.py` and `scripts/compute_cka.py` in the [repo branch](https://github.com/Ja-Crispy/Johnson-Lindenstrauss/tree/preservation/2026-04-23). full writeup with numbers: [layer_structure_carrier_cross_model.md](https://github.com/Ja-Crispy/Johnson-Lindenstrauss/blob/preservation/2026-04-23/docs/layer_structure_carrier_cross_model.md).

## first weird thing: middle layers look 1-dimensional

per-layer `d_eff_c` for qwen2.5-1.5b across 28 transformer blocks:

- L0 (embedding output): 41.7
- L1 (after first block): 110.8
- **L2 through L26: 1.0 to 1.2**
- L27: 56.7
- L28 (final): 13.3

twenty-five consecutive layers with `d_eff_c ≈ 1`. the activation across 4096 positions has variance concentrated in essentially one direction. and the residual stream norm grows from ~18 at L1 to ~290 at L26. sixteen times larger, all going into one direction.

if you took this at face value you'd say the model spent 25 layers refining a 1-dimensional representation. that can't be right. so we tested whether removing one direction recovers structure.

![per-layer d_eff_c on qwen2.5-1.5b, original and after projecting off the top-k carrier subspace](/blog/images/whats-under-the-cosine/recovery_qwen.png)

after projecting off the rank-1 carrier (the top right singular vector of the stacked L2-L26 activations), middle-layer `d_eff_c` jumps from ~1 to **70-140**. one direction was hiding rich variance structure underneath.

same pattern shows up on gemma-3-1b and mistral-7b:

![gemma d_eff recovery, same shape as qwen with slightly more recovery from rank>1 components](/blog/images/whats-under-the-cosine/recovery_gemma.png)

![mistral d_eff recovery. the jumps at k=2 and k=3 are the giveaway that mistral has a multi-rank carrier](/blog/images/whats-under-the-cosine/recovery_mistral.png)

## what's there: a persistent low-rank carrier

across L2-L26 in qwen, the top right singular vector of each layer's centered covariance is essentially the **same direction**. cross-layer alignment matrix `M[i,j] = |v_1^(i) · v_1^(j)|` averages 0.9995 off-diagonal. one direction, persistent across 25 layers.

![cross-layer top-PC alignment heatmap for qwen, L2-L26. uniform yellow at mean off-diag 0.9995](/blog/images/whats-under-the-cosine/persistence_qwen.png)

the top-1 right singular vector of the **stacked** middle-layer activations explains 97.85% of the variance among the top-50 components. for gemma it's 98.03%. for mistral it's 84.42% (rank-2 captures 89%, so mistral's carrier is genuinely 2-3 dimensional rather than rank-1).

so all three models have a low-rank persistent carrier subspace dominating the residual stream's middle band. the apparent 1-d collapse is a measurement artifact of one (or two) dominant directions. there's rich structure underneath; you just can't see it from raw d_eff or raw cosine.

this matches the existing literature on "outlier features" and "massive activations". see [dettmers et al. 2022](https://arxiv.org/abs/2208.07339) and [sun et al. 2024](https://arxiv.org/abs/2402.17762). what's new is the cross-family test of *what kind* of carrier each model uses.

## three families, three carriers

we ran two probes on each model's rank-1 carrier:

**probe 1: position localization.** for each token position `t`, compute `|h[t] · c_1|`. if a single position has way more carrier energy than the rest, the carrier is acting like an attention sink (a la [xiao et al. 2023](https://arxiv.org/abs/2309.17453)).

**probe 2: dark-subspace alignment.** [cancedda 2024](https://aclanthology.org/2024.acl-long.263/) showed that on llama2 the BOS attention sink lives in `W_unembed`'s tail singular vectors. directions the unembedding ignores. we project the carrier onto the bottom-100 right singular vectors of `W_unembed` and compare to a random direction baseline.

| model | peak position | max/median carrier energy at peak | rank-1 carrier in W_unembed tail-100 | dark multiplier |
|---|---:|---:|---:|---:|
| **qwen2.5-1.5b** | 0 | 4083× | 35.3% | 5.4× random |
| **mistral-7b** | 0 | 252× | 4.21% | 1.7× random |
| **gemma-3-1b** | 460 | 1.7× (uniform) | 0.88% | **0.1× random (anti-dark)** |

three flavors:

- **qwen**: position-0 spike of 4000×, partially aligned with `W_unembed`'s null space. classic cancedda dark sink, weaker than llama2 but recognizable.
- **mistral**: position-0 spike of 250×, mildly dark. similar mechanism, lower intensity. by rank-3 the multi-rank carrier hits 23.6× random in tail-20. the dark structure is at higher ranks, not rank-1.
- **gemma**: no spike. carrier energy is roughly uniform across positions (max/median = 1.7). and the carrier sits in the **bright** subspace, the directions `W_unembed` actively reads to produce logits. ten times *less* in the tail than a random direction.

![position localization on qwen, single massive spike at position 0, ratio in the thousands](/blog/images/whats-under-the-cosine/position_qwen.png)

![position localization on mistral, same shape as qwen at lower intensity](/blog/images/whats-under-the-cosine/position_mistral.png)

![position localization on gemma, no spike, just gentle position dependence](/blog/images/whats-under-the-cosine/position_gemma.png)

so qwen and mistral have cancedda-style dark sinks. gemma doesn't. gemma has a persistent low-rank carrier just like the others, but the carrier is bright-aligned and position-uniform. whatever it's doing, it isn't an attention sink in the streaming-LLM sense.

![cross-model dark alignment, rank-1 and rank-3 carrier vs random baseline](/blog/images/whats-under-the-cosine/dark_alignment.png)

## the cosine confound, revisited

so what does this say about adjacent-layer cosine? the original muyu critique was that cosine is too coarse to track layer behavior. with the carrier picture in hand, we can be more specific.

we computed `cos(h_l, h_{l+1})` per position and averaged, then did the same after projecting off the top-k carrier subspace, k ∈ {1, 2, 3, 5}. the question: does removing the carrier expose layer-to-layer variation that raw cosine flattens?

| model | raw cos sim band (middle) | mean band gap k=1 | k=5 |
|---|---|---:|---:|
| qwen2.5-1.5b | 0.85-0.96 | 0.0004 | 0.026 |
| mistral-7b | 0.83-0.95 | 0.0012 | 0.006 |
| **gemma-3-1b** | **0.97-0.99** | **0.136** | **0.149** |

on qwen and mistral, removing the carrier barely moves cosine. gaps under 0.03 even with rank-5 of the carrier projected off. the perpendicular content also persists per-token across layers. you can't fix cosine on these models by subtracting the dark direction.

on gemma, removing the carrier drops cosine by **0.10-0.34** across most middle transitions. l17→l18 raw cosine = 0.98, carrier-removed at k=1 = 0.64. that's the kind of variation muyu's hypothesis predicted, and it's what we'd want from a layer-utility metric.

![carrier-removed cosine on qwen, barely moves at any rank](/blog/images/whats-under-the-cosine/cosine_qwen.png)

![carrier-removed cosine on gemma, drops substantially at all ranks](/blog/images/whats-under-the-cosine/cosine_gemma.png)

![carrier-removed cosine on mistral, even more immune than qwen](/blog/images/whats-under-the-cosine/cosine_mistral.png)

cosine isn't uniformly broken. it's broken in a carrier-identity-dependent way. when the carrier is the sink and the perpendicular subspace also has stable per-token directions, both raw and carrier-removed cosine fail. when the carrier is bright and position-uniform, removing it actually helps.

## CKA isn't a fix either

the obvious next question: is [linear CKA (kornblith et al. 2019)](https://arxiv.org/abs/1905.00414) better? CKA centers and uses gram matrices, in principle robust to outlier dimensions. so we ran adjacent-layer linear CKA, raw and carrier-removed, on the same three models.

| model | raw cos sim band | raw CKA band | k=1 cos gap | k=1 CKA gap |
|---|---|---|---:|---:|
| qwen2.5-1.5b | 0.85-0.96 (varies) | **0.998-1.000 (saturated)** | 0.0004 | ~0.05 |
| mistral-7b | 0.83-0.95 (varies) | **0.999-1.000 (hyper-saturated)** | 0.001 | ~0.005 |
| gemma-3-1b | 0.97-0.99 (flat) | **0.4-0.99 (varies)** | 0.14 | tracks raw |

![CKA vs cosine on qwen. raw CKA at 1.0 across the entire middle band, more saturated than cosine](/blog/images/whats-under-the-cosine/cka_qwen.png)

![CKA vs cosine on gemma. raw CKA varies dramatically where cosine is flat](/blog/images/whats-under-the-cosine/cka_gemma.png)

![CKA vs cosine on mistral. raw CKA hyper-saturated, even more useless than on qwen](/blog/images/whats-under-the-cosine/cka_mistral.png)

three patterns again, and the CKA story flips depending on the model:

- **qwen and mistral**: raw CKA is **even more saturated** than cosine. it sits at 0.998-1.000 across the entire middle band where cosine at least varies between 0.85 and 0.96. the carrier dominates the gram matrix even harder than it dominates the per-token inner product.
- **gemma**: raw CKA naturally **exposes** the variation that cosine flattens. l5→l6 raw CKA = 0.40 while raw cosine = 0.97 on the same transition.

quick intuition for why this flips. CKA's centering should discount uniformly-distributed features. on gemma's position-uniform carrier this works. centering removes the uniform component and CKA tracks what's left. on qwen and mistral the carrier is a position-0 outlier (one position has thousands of times the carrier energy of the rest), and centering across positions doesn't kill that outlier's effect on the gram matrix. CKA gets dominated.

so CKA isn't a universal fix. it has a different carrier-dependent failure mode than cosine, and on sink-style models the failure is worse. every standard adjacent-layer similarity metric we tried has a carrier-identity-dependent way it can fail.

## BOS check (because we should have)

one nuance from cancedda's setup we didn't initially honor: he uses llama2's default tokenizer which auto-prepends `<s>`. our `tokenizer.encode(..., add_special_tokens=False)` skipped BOS. so our "position 0" was the first wikitext content token, not a deliberate BOS marker.

we re-ran with BOS included to check whether the position-0 sink was anchored on a special token or on the first position regardless.

| model | BOS available? | without BOS (peak/ratio) | with BOS (peak/ratio) | dark alignment unchanged? |
|---|---|---|---|---|
| qwen2.5-1.5b | **no, qwen's tokenizer has no BOS token** | pos 0, ratio 4083 (L8) | n/a | n/a |
| gemma-3-1b | yes (`<bos>`) | uniform, ratio 1.7 (L11) | **pos 0, ratio 10.4** (L9) | yes (0.88% / 0.10× both runs) |
| mistral-7b | yes (`<s>`) | pos 0, ratio 987 (L7) | **pos 0, ratio 2496 (L6)** | yes (1.72× → 1.81×) |

three findings:

- **qwen2.5 literally has no BOS token** in its tokenizer (qwen uses chatml templates, no BOS marker). qwen's position-0 sink is *necessarily* on the first content token, not a special token. you can't make it move by adding BOS.
- **gemma**: position-0 spike emerges when BOS is included (1.7× → 10.4×). gemma will absorb carrier energy into a BOS token if you give it one, but doesn't manufacture a sink without one.
- **mistral**: sink intensifies with BOS (987× → 2496×). consistent with cancedda's BOS-as-sink mechanism in a different family.
- **carrier dark/bright identity is BOS-invariant** in both gemma and mistral. what changes with BOS is sink intensity, not what subspace the carrier lives in.

so the structural finding (qwen partially dark, mistral mildly dark, gemma anti-dark) holds with or without BOS. it's a property of the model, not of how we tokenized.

## is the carrier load-bearing? a causal test

everything above is structural. it tells us cosine and CKA flatten a real geometric thing, but not whether the model needs that thing. so we ran a forward-pass intervention.

setup: hook a transformer block's output, modify the residual stream before the next block reads it, run wikitext-2 forward to get next-token NLL. five conditions per target layer:

1. **baseline** — no hook
2. **carrier_remove**: `h ← h - (h · c) c`
3. **random_remove**: `h ← h - (h · r) r`, `r` random unit, averaged over seeds
4. **direction_swap**: `h ← h - (h · c) c + (h · c) r`, `r ⊥ c`. preserves carrier coefficient *magnitude* but redirects to a random orthogonal direction
5. **centered_remove**: project off the centered top-PC instead of the uncentered carrier

we report ΔNLL (nats per token, vs baseline) as the primary unit. PPL ratios become unstable once a model is broken; nats stay interpretable.

![cross-model ΔNLL bar chart. random direction removal sits at zero everywhere. carrier removal and direction swap are graded by carrier identity. gemma's bright-carrier removal is more catastrophic than uniform random predictor would be.](/blog/images/whats-under-the-cosine/ablation_cross_model.png)

results across three families:

| model · layer | random_remove | carrier_remove | direction_swap | centered_remove |
|---|---:|---:|---:|---:|
| Qwen2.5-1.5B  L7   | ~0.00 nats | **+0.83** | +1.15 | +1.08 |
| Gemma-3-1B  L9 (no BOS) | +0.05 | **+18.67** | +21.07 | +4.50 |
| Mistral-7B  L13 (fp16) | +0.00 | +0.16 | +1.09 | +0.15 |

three things land cleanly:

**1. random direction removal is at-baseline on every model.** ΔNLL stays under 0.05 nats. so the carrier-removal damage is direction-specific, not "any direction matters". the carrier we identified spectrally is the same direction the model causally depends on.

**2. carrier identity governs the magnitude of the failure.** qwen's dark/sink carrier removal raises NLL by 0.83 nats — the model degrades but stays coherent. mistral's rank-1 removal is even milder (0.16 nats), because mistral's carrier is rank-2 and we only attacked rank-1 here. gemma's bright carrier removal raises NLL by **18.67 nats**. log(vocab_size) on gemma is ≈12.4 nats, the worst possible NLL for a uniform random predictor. gemma at carrier_remove is 6+ nats *above* that ceiling — the model is now actively assigning probability mass *away* from the true tokens. removing the bright carrier breaks the model harder than just confusing it.

so the obvious framing — "bright carriers might be readout-aligned redundancies, dark carriers are the real infrastructure" — is wrong. the bright carrier *is* the infrastructure. the unembedding reads from it directly. break it and the path to logits is gone. the dark sink in qwen is also infrastructure, but a different kind — supports attention transport rather than logit readout. removing it costs you, but logits still have partial routes.

bright vs dark isn't important vs unimportant. it's *what kind of infrastructure*.

**3. direction matters, not just energy.** direction_swap (preserves coefficient magnitude, redirects to random orthogonal direction) is consistently worse than carrier_remove on every model. gap is +0.32 nats on qwen, +2.4 nats on gemma, +0.93 nats on mistral. the model isn't just affected by losing the carrier's energy — it's specifically broken by having that energy redirected to noise. downstream layers must be actively reading the carrier direction as content; wrong-direction energy creates active interference, not just lost signal.

### sanity checks (gemma L9)

we ran two extra controls on gemma's most catastrophic case:

- **hook_noop**: hook returns input unchanged. PPL = 57.9389 = baseline exactly. the hook machinery itself doesn't perturb the residual stream. the catastrophic effect is real.
- **norm_restored**: project off carrier, then rescale per-position to recover original `||h||`. if the failure were just "next layer's RMSNorm sees the wrong norm", restoring it should help. it does the opposite. ΔNLL goes from +18.7 (plain carrier removal) to +34.0 (norm restored). filling the lost carrier-direction norm into the perpendicular subspace creates more interference, not less. the failure is about what's in the carrier direction, not norm magnitude.

both controls confirm the carrier signal is itself the load-bearing component.

## what this changes (and doesn't)

we didn't find the right metric. we found that the right object is the carrier regime, and that "is layer L being utilized" is the wrong framing for what dense transformers do at depth.

a cleaner framing: depth in dense transformers is a **transport-plus-computation** trade-off, and the carrier subspace is causally load-bearing infrastructure. each model allocates depth between maintaining a low-rank carrier (transport, infrastructure that the rest of the network builds around) and doing perpendicular work (computation, content). the carrier can be a dark attention sink (qwen, mistral, llama2), a bright distributed feature (gemma), or some mix. cosine and CKA both fail in carrier-identity-dependent ways because both implicitly assume the residual stream is a single space rather than a transport-plus-computation decomposition.

the per-model carrier signature looks something like:

- **collapsed band**: layers where d_eff_c < ~5
- **carrier rank**: 1 (qwen, gemma) or 2-3 (mistral)
- **carrier identity**: dark/sink (qwen, mistral) or bright/uniform (gemma)
- **carrier-write fraction**: how much each layer's update is along the carrier vs perpendicular (qwen+mistral: 99%+ perpendicular, gemma: 60%+ perpendicular but more variable)
- **cosine recoverability**: whether removing the carrier exposes layer variation in cosine

that's a richer object than a single utilization scalar. and it's the kind of thing that probably wants its own metric portfolio: cancedda's spectral filters, our d_eff decomposition, kornblith CKA, plus ablation impact for causal grounding.

## what we didn't do

caveats explicit in the writeup:

- **n = 3 dense families on apple silicon.** no llama, no phi, no MoE, no hybrid. extending breadth requires CUDA for most hybrid families (mamba_ssm, flash_attn deps).
- **wikitext only.** domain effects untested.
- **rank-1 dark-alignment is partial.** all three models have dark components at higher carrier ranks. the "qwen dark, gemma bright" dichotomy is specifically about rank-1. by rank-5 mistral is more dark-aligned than qwen.
- **mistral ablation is rank-1 only at one layer (L13, fp16).** mistral's carrier is genuinely rank-2 (top-1 captures only 84% of stacked variance vs 98% for qwen and gemma). the small ΔNLL of +0.16 on mistral is a lower bound on the full carrier's importance — multi-rank ablation would amplify this. compute budget on m5 max ruled out a full sweep.
- **norm_restored sanity check is gemma-only.** the conclusion that norm preservation doesn't help may be specific to bright-carrier models. testing on qwen would tighten this.

so this is a strong case study, not a general claim. the carrier picture and its causal grounding hold across the three families we did test, which is enough for the next conversation to be about decomposition rather than which similarity metric to swap in.

## what's next

the obvious next moves:

- **mistral multi-rank ablation.** mistral's carrier is rank-2; rank-1 removal at one layer underreports. would expect a much larger ΔNLL with full carrier-subspace removal.
- **breadth.** llama-3, phi, MoE families. cancedda 2024 already covers llama-2; extending to llama-3 would be a clean check on whether the family-by-family contrast we saw between qwen, gemma, and mistral persists.
- **what does gemma's bright carrier encode?** that's mech interp territory: probing, position-conditional analysis, comparing to known content directions in the unembedding. the structural and causal evidence both say it's load-bearing; the mechanistic question is what it's load-bearing *for*.
- **gemma's carrier as a hybrid case.** gemma has rank-1 ≈ 98% of variance like qwen, but the carrier is bright like none of the cancedda-style models. it's the case least explained by the existing literature.

the immediate practical takeaway: when you see a "layers are underutilized" plot from raw adjacent-layer cosine, the first question to ask is what the residual stream's carrier looks like, and whether removing that carrier actually breaks the model. without those, the metric is flattening structure that adjacent-layer similarity cannot see and cannot recover by switching to a different similarity metric.

---

*kicked off by [muyu he's thread](https://x.com/HeMuyu0327/status/2048615865222938972). thanks to [tom turney](https://github.com/TheTom) for kv-cache compression context that surfaced the spectral toolkit, and [nicola cancedda](https://aclanthology.org/2024.acl-long.263/) for the dark-signal framework. half this post is just running his test on different models.*

*code, data, and full writeup: [Ja-Crispy/Johnson-Lindenstrauss @ preservation/2026-04-23](https://github.com/Ja-Crispy/Johnson-Lindenstrauss/tree/preservation/2026-04-23).*

*references inline. key ones:*

- *[muyu he, thread on adjacent-layer cosine and curse of depth](https://x.com/HeMuyu0327/status/2048615865222938972)*
- *[cancedda 2024 — spectral filters, dark signals, attention sinks (ACL long)](https://aclanthology.org/2024.acl-long.263/)*
- *[xiao et al. 2023 — streamingLLM / attention sinks](https://arxiv.org/abs/2309.17453)*
- *[sun et al. 2024 — massive activations in LLMs](https://arxiv.org/abs/2402.17762)*
- *[dettmers et al. 2022 — LLM.int8() / outlier features](https://arxiv.org/abs/2208.07339)*
- *[kornblith et al. 2019 — linear CKA](https://arxiv.org/abs/1905.00414)*
- *[curse of depth (sun et al. 2025)](https://arxiv.org/abs/2502.05795)*
- *[turboquant+ — tom turney](https://github.com/TheTom/turboquant_plus)*
- *[johnson-lindenstrauss exploration — nick yoder](https://nickyoder.com/johnson-lindenstrauss/)*
