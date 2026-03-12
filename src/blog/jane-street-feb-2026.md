---
title: "it's alive"
date: 2026-02-25
tags: ["jane-street", "neural-networks", "optimization", "puzzles", "combinatorics"]
summary: "reassembling a 48-block neural network from 97 shuffled pieces, and why random chaos beat gradient descent."
series: "jane street puzzles"
series_order: 1
---

> "i collected the instruments of life around me, that i might infuse a spark of being into the lifeless thing that lay at my feet."
> — Mary Shelley, *Frankenstein*

Jane Street's [february 2026 puzzle](https://huggingface.co/spaces/jane-street/droppedaneuralnet) gives you 97 weight files — the dismembered layers of a 48-block residual neural network — and asks you to stitch them back together. we have historical input/output data. we know the architecture. we have all the body parts. we just don't know which goes where.

the search space is 48! × 48! ≈ 10^122. more atoms than the observable universe. squared.

random chaos solved it in 40 minutes.

## the anatomy

the creature's architecture is a simple residual network:

```
x = input (N×48)
for block k in [0..47]:
    x = x + out_k(relu(inp_k(x)))
pred = final(x)
```

**97 pieces**: 48 inp layers (96×48), 48 out layers (48×96), 1 final layer (1×48). we need to find which inp pairs with which out (the *pairing*) and what order the blocks go in (the *ordering*). the answer is a 97-element permutation, verified by SHA-256.

we separated pieces by weight matrix shape and built a `CachedEvaluator` that stores intermediate activations after each residual block. when testing a swap at block k, it only recomputes from k onward. about 10x faster than naive evaluation. you need this — the creature has 48 organs and you'll be rearranging them thousands of times.

## galvanism (MSE: 0.957 → 0.323)

the proper scientific approach. make it differentiable.

we used **Gumbel-Sinkhorn** — relaxing discrete permutation matrices into continuous doubly-stochastic ones via Sinkhorn normalization. two 48×48 learnable matrices, one for ordering, one for pairing. temperature annealing from soft to hard, Hungarian projection for the final discrete answer.

elegant. careful. the way Victor would've done it.

three runs with different hyperparameters:
- **strong warm start** (strength=5-8): trapped at MSE ≈ 0.323. every time. 3000 epochs of watching the loss flatline.
- **weak warm start** (strength=3, noise=0.2): MSE ≈ 0.304. the noise found a different basin.
- **cold start**: nothing useful. the landscape from scratch is too rugged.

the problem is fundamental: **differentiable relaxations smooth the discrete landscape so aggressively they can't resolve fine structure.** the soft forward pass mixes all 48 pieces simultaneously — it literally can't represent "piece 43 goes in position 0, not a blend of pieces 43, 17, and 82."

for reference, [Yi Wang](https://wangyi.ai/blog/2026/02/16/solving-jane-street-dropped-neural-net/) used the same Gumbel-Sinkhorn approach and reached MSE ≈ 0.03. even Yi switched to local search for the endgame. the technique has a resolution ceiling.

<!-- MEME: [this-is-fine dog — "3000 epochs of sinkhorn, loss hasn't moved in 2000 iterations"] -->

## proof of death

before giving up on the careful approach, we proved the creature was truly dead:

- **full cost matrix + Hungarian re-pairing**: tried all 48 possible out-pieces at every position, built a 48×48 cost matrix, ran Hungarian for optimal assignment. **result: 0 changes.** already a robust local optimum — even this stronger method that can find 3-cycles and longer reassignment chains found nothing.
- **block removal analysis**: checked if any block was actively harmful. all 48 contributed positively. none destructive, just suboptimal.
- **per-block exhaustive search**: tried every possible inp and out at every position. no single swap improved anything.

the solution needed coordinated multi-position changes that no pairwise method could find. the body was assembled wrong, and you couldn't fix it one organ at a time.

<!-- MEME: [surprised pikachu — "tried every single possible swap, none of them help"] -->

## the lightning bolt (MSE: 0.304 → 0.035)

stuck at a provably strong local optimum, we tried something Victor Frankenstein would've appreciated: **raw electricity.** randomly shuffle out-pieces among k positions, then polish with 2-opt.

trial 3: shuffle 6 blocks. MSE drops from 0.304 to **0.272**.

wait, what?

trial 7: shuffle 5 blocks. **0.262.**
trial 10: shuffle 4 blocks. **0.215.**
trial 14: shuffle 3 blocks. **0.073.**
trial 19: shuffle 6 blocks. **0.035.**

each improvement became the starting point for the next jolt. the solution cascaded — fixing a few wrong pairings unlocked the next set of corrections. in 20 random perturbations, dumb shuffling accomplished what 3000 epochs of gradient descent couldn't.

the creature twitched.

but we hit a floor at 0.035. the perturbation only shuffled out-pieces (pairings). what about the ordering?

<!-- MEME: [drake meme — rejecting: "3000 epochs of differentiable optimization", accepting: "randomly shuffle 6 things and see what happens"] -->

## it's alive (MSE: 0.035 → 0.000)

the key insight: **there are four semantically distinct ways to perturb the layer assignment**, and each navigates a different region of the search space.

| type | what it shuffles | what changes |
|---|---|---|
| `out` | out-pieces among k positions | pairings only |
| `inp` | inp-pieces among k positions | ordering only |
| `block` | entire blocks (inp+out together) | ordering (preserves pairing) |
| `mixed` | inp and out independently | everything |

we also added targeted perturbation: diagnostic analysis identifies blocks with high delta/x ratios (likely misplaced), and 40% of perturbations preferentially include these blocks. aim the lightning where the stitching looks wrong.

the solve trace:

| trial | type | blocks | MSE | improvement |
|---:|---|:---:|---:|---:|
| 1 | block | 4 | 0.03297 | 0.00189 |
| 2 | **inp** | 5 | 0.02423 | 0.00874 |
| 10 | out | 10 | 0.02241 | 0.00182 |
| 11 | **inp** | 11 | 0.02043 | 0.00198 |
| 12 | **inp** | 9 | 0.01951 | 0.00092 |
| 14 | **inp** | 9 | 0.01909 | 0.00043 |
| 16 | **inp** | 12 | 0.01451 | 0.00458 |
| 17 | block | 4 | 0.00811 | 0.00640 |
| 21 | **inp** | 10 | 0.00382 | 0.00429 |
| **22** | **out** | **13** | **0.00000** | **0.00382** |

**solved in 22 perturbation trials.** ~40 minutes on an RTX 3050 Laptop GPU.

three things:

1. **inp perturbation found 6 of 10 improvements.** reordering blocks — not re-pairing — dominated the endgame. exactly the move type our earlier solver never tried.

2. **the killing blow was out-shuffling 13 blocks.** after inp fixed the ordering, one large pairing correction snapped everything into place. the two perturbation types are complementary — you need both.

3. **the cascade is real.** each correction restructures the intermediate activations flowing through downstream blocks, changing which swaps become beneficial. fixing block 5's ordering might make block 23's pairing correction suddenly effective. you can't plan this. you keep jolting and see what the polish step finds.

the creature opened its eyes. MSE = 0.000. SHA-256 verified.

<!-- MEME: [frankenstein "it's alive!" scene — terminal showing MSE: 0.00000000000000] -->

## the full trajectory

```
0.957 ──→ 0.397 ──→ 0.323 ──→ 0.304 ──→ 0.035 ──→ 0.024 ──→ 0.008 ──→ 0.000
 v1        v4        v4        v5        v5        v7        v7        v7
2-opt    Sinkhorn  Sinkhorn  Sinkhorn  random    typed     typed     typed
                   (weak)    (weak)    perturb   perturb   perturb   perturb
```

two phase transitions:
- **0.304 → 0.035**: random out-shuffling breaks through the Sinkhorn ceiling
- **0.035 → 0.000**: adding inp/block/mixed types resolves the remaining structure

## the other scientist

Yi Wang [published a solution](https://wangyi.ai/blog/2026/02/16/solving-jane-street-dropped-neural-net/) with a different endgame:

| | Yi Wang | us |
|---|---|---|
| **mid-game** | Gumbel-Sinkhorn → MSE ~0.03 | Gumbel-Sinkhorn → MSE ~0.323 |
| **endgame** | combined 2-opt, alternating cycles | multi-type perturbation + 2-opt polish |
| **key insight** | pairing corrections unlock ordering cascades | diverse perturbation types escape basins |
| **mechanism** | exploiting diagonal valleys | stochastic restarts, expanding neighborhoods |

Yi's Sinkhorn got much closer (0.03 vs our 0.323), likely better hyperparameter tuning. but the endgames are complementary — Yi's is *deterministic and exhaustive* within a fixed neighborhood, ours is *stochastic and variable-radius*. one exploits structure, the other explores it.

hitting a higher Sinkhorn ceiling actually forced us down a more interesting path. when the careful method gets you 90% there, you reach for finer tools. when it gets you 70% there, you have to invent something different.

## what the creature taught us

for combinatorial optimization over coupled discrete structures:

**structured random perturbation beats both gradient relaxation and deterministic neighborhood expansion** — but only when the perturbation operator is designed with domain knowledge.

the four types aren't arbitrary. they decompose the solution space along the problem's natural axes: ordering vs pairing, coupled vs independent. a generic "shuffle k random positions" would work eventually, but typed perturbations converge faster because each navigates a different subspace of corrections.

this is iterated local search (ILS), a well-studied metaheuristic. what's new here is the operator design — **perturbation type diversity matters as much as perturbation radius.** the winning sequence used 4 types across 4-13 blocks. no single type could've solved it alone.

the broader principle: when you're stuck at a local optimum, don't just perturb harder. **perturb differently.**

Mary Shelley would've approved. the creature wasn't built by careful surgery. it was built by lightning.

---

*thanks to [Yi Wang](https://wangyi.ai/blog/2026/02/16/solving-jane-street-dropped-neural-net/) for the complementary approach and insightful writeup. code at [TODO](https://github.com/TODO). the answer permutation SHA-256 hash: `093be1cf...e7d9c4`.*
