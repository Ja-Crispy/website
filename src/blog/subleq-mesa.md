---
title: "the mesa at the end of the universe"
date: 2025-03-09
tags: ["research", "subleq", "optimization", "evolution"]
summary: "we trained a transformer to be a computer. then we tried to find the programs it would run. turns out program space is a hitchhiker's nightmare."
---

> "the answer to the great question... of life, the universe and everything... is forty-two." - deep thought

the thing about 42 is that it's a perfectly valid answer. the problem was always the damn question.

dimitris papailiopoulos's group at UW-Madison [did something analogous](https://x.com/DimitrisPapail/status/2027089179381833858). they trained a 4.9M parameter transformer to learn the execution rule of the simplest possible computer - SUBLEQ. feed it a machine state, it predicts the next one. >99.5% accuracy on unseen programs. SGD found a universal interpreter. that's the answer.

but nobody asked the question: if training the *interpreter* is "just gradient descent," what about finding the *programs* that interpreter would run?

we spent a few months poking at that question. the answer is... well, it's not 42. it's more like trying to find a specific grain of sand on magrathea. program space is a razor's edge, and no amount of clever searching makes it less sharp.

## what subleq is (or: one instruction to rule them all)

SUBLEQ is the babel fish of computation. one instruction, three numbers:

```
mem[b] -= mem[a]
if mem[b] <= 0: goto c
else: goto pc + 3
```

subtract, then conditionally branch. that's it. three operands, turing-complete. any computation you can imagine reduces to a sequence of these.

here's the intuition for why it's hard to search. imagine a city where every intersection has exactly one traffic light. manhattan works because nearby intersections produce similar journeys. now imagine a city where changing one traffic light teleports you to a random location. that's SUBLEQ: change one address and the program counter jumps somewhere entirely different, executing completely different code. there is no local geometry.

<figure class="meme">
<img src="/blog/images/subleq-mesa/you-are-here.jpg" alt="you are here">
<figcaption>average program space navigation experience</figcaption>
</figure>

## the mesa: a landscape you can't climb

we measured the fitness landscape of SUBLEQ programs solving modular addition - computing `(a + b) mod N`. what we found is what we call the *mesa topology*. if the fitness landscape of neural networks is the rolling hills of the shire, program space is the cliffs of insanity.

![mesa topology - the flat top, sheer cliff signature of program space](/blog/images/subleq-mesa/fig1_mesa.png)

**zero basin of attraction.** we hill-climbed from 100 random programs. zero reached any working solution. in weight space, random init + gradient descent converges reliably. in program space, you start nowhere and go nowhere.

**huge neutral networks on-manifold.** starting from a known solution, we random-walked while maintaining perfect fitness. the walk reached hamming distance 20 out of 21 mutable values - the program was almost completely rewritten and still worked. this isn't one solution. it's an absurdly large equivalence class connected by neutral mutations - dead code, aliasing, accidental no-ops. like the infinite improbability drive, it shouldn't work, but it does.

<figure class="meme">
<img src="/blog/images/subleq-mesa/confused.jpg" alt="what even-">
<figcaption> well, it works, but we don't know why</figcaption>
</figure>

**catastrophic failure off-manifold.** one mutation to a working program drops mean accuracy from 100% to 59%. two mutations: 42% (there it is again). three: 36%. by five, you're at random baseline. there is no gentle slope. it's a cliff x_x

<figure class="meme">
<img src="/blog/images/subleq-mesa/this-is-fine.jpg" alt="this is fine">
<figcaption>fitness: 1.0. one mutation later: 0.59. this is fine.</figcaption>
</figure>

flat top, sheer sides, unreachable from below. that's a mesa. it's the opposite of the smooth bowl that SGD surfs in weight space.

the information theory backs it up. we measured mutual information between individual program values and fitness across 50,000 random programs. max MI per value: 0.29 bits. individual values carry almost no information about correctness. the signal only shows up in *coordinated* values - instruction 7's source and destination fields have joint MI 0.21 bits above their individual sum. programs are holistic objects. there is no byte-by-byte gradient to follow. you can't decompose the answer into parts any more than you can decompose 42 into useful sub-answers.

![mutual information between program values and fitness - individual values carry almost nothing](/blog/images/subleq-mesa/fig15_information.png)

## same system, opposite geometry

the cleanest experiment puts both spaces on the same substrate. we trained a 138K-parameter transformer to learn the SUBLEQ step function on a miniaturized system (8 cells, 4-bit signed values). 82% accuracy - imperfect, but enough for comparison.

![the interpreter transformer - 82% accuracy on miniaturized SUBLEQ](/blog/images/subleq-mesa/fig11_interpreter.png)

then we ran identical perturbation analysis on both:

**transformer weights:** gaussian noise at increasing scales. accuracy holds steady across two orders of magnitude (sigma 0.0001 to 0.015). the cliff comes at sigma ~0.04, roughly 0.07% of the weight norm. even an imperfect interpreter sits in a smooth, wide basin.

**SUBLEQ programs on the same system:** one mutation to a working 3-instruction negate program drops accuracy to 5.7%. two mutations: 1.3%. half-life is less than one mutation.

![damage curves - transformer weights degrade gracefully, programs fall off a cliff](/blog/images/subleq-mesa/fig2_perturbation.png)

same computation. same evaluation. the difference is pure geometry. weight space maps nearby parameters to nearby functions. program space maps nearby encodings to unrelated functions. zaphod beeblebrox could navigate weight space with both heads tied behind his back. program space would stump even deep thought.

## why evolution can cross the gap (sometimes)

pure hill-climbing fails on mesas. but evolution has tools hill-climbing doesn't: populations maintain diversity on neutral plateaus, and crossover occasionally combines partial solutions. evolution is the infinite improbability drive of optimization - statistically absurd, yet empirically effective.

when we give evolution the right scaffold, it works. the technique is *compositional warm-start*: freeze a working subcircuit (addition) and let evolution discover the rest (modular reduction - the branch that subtracts N when the sum overflows).

| setup | result |
|---|---|
| cold start (no scaffold) | 0/20 solved |
| warm-start, mutate everything | 0.76 best fitness |
| **warm-start, protect head** | **17/20 solved, median 195 gens** |

![compositional warm-start - freezing the addition head lets evolution find the branch](/blog/images/subleq-mesa/fig3_composition.png)

across all N from 3 to 30, protect-head solves 17-20 out of 20 seeds.

but the *interface* matters. when the addition subcircuit halts, the evolvable tail is unreachable - execution never gets there, no matter what mutations create. with a "flow-through" interface (no halt, execution falls into the tail), the tail becomes reachable and evolution discovers the branch in a few hundred generations.

this generalizes. we pushed one level deeper: freeze mod-add and evolve mod-multiply (requires a loop). 8/10 solved with a reentrant interface, 0/5 with halt-terminated. same computation, different accessibility. the door has to be open for evolution to walk through it.

## punctuated equilibrium on the mesa

how does evolution navigate the mesa? not smoothly. we tracked the best program every 10 generations. the pattern: long plateaus of neutral drift (hamming distance changes by 0-1 per checkpoint) punctuated by sudden jumps (hamming distance leaps by 3+ in a single generation).

![stepping stones - fitness plateaus punctuated by sudden structural discoveries](/blog/images/subleq-mesa/fig10_stepping_stones.png)

each run shows 3-7 jumps. fitness plateaus between them. the mesa topology predicts exactly this - neutral drift until a lucky multi-mutation event finds a higher plateau. the jumps are the program "discovering" a structural motif: a branch target, an address alignment, something that unlocks a new class of test cases.

this is punctuated equilibrium in the literal gould-eldredge sense, arising from landscape geometry rather than ecological dynamics. darwin would've loved it. or hated it. hard to say.

## the N=10 puzzle

one of the weirdest findings: difficulty is non-monotonic in problem size.

| N | solve rate | median gens |
|---|---|---|
| 3 | 20/20 | 147 |
| 5 | 17/20 | 195 |
| 7 | 17/20 | 258 |
| 10 | 20/20 | 688 |
| 20 | 19/20 | 91 |
| 30 | 20/20 | 110 |

N=10 is the hardest. despite *higher* solve rate than N=5 or N=7, its median generation count is 3-4x worse. and larger N is *easier*. what? o_o

![the N=10 puzzle - difficulty peaks in the middle, not at the extremes](/blog/images/subleq-mesa/fig12_n10_puzzle.png)

it's fitness granularity. with N test cases producing N^2 evaluations:

- **N=3:** 9 test cases, fitness steps of 11%. random mutations sometimes score nonzero. signal exists.
- **N=10:** 100 test cases, fitness steps of 1%. neighbors cluster at ~0.44 fitness. dead zone. almost no gradient.
- **N=20:** 400 test cases, steps of 0.25%. fine-grained gradient guides evolution effectively.

N=10 sits in a goldilocks zone of difficulty - enough test cases that random programs score near-zero, but too few for smooth gradients. like that one restaurant at the end of the universe - technically accessible, practically impossible to get a reservation.

## every run finds a different algorithm

are the solved programs all variations of one algorithm? we re-evolved 20 programs per N value and compared them pairwise.

all unique. mean hamming distance is 19-20 out of 21 mutable values. these programs are almost completely rewritten from each other. MDS projection shows no clusters - solutions scatter uniformly across a high-dimensional space.

![program diversity - every solution is unique, scattered uniformly across the space](/blog/images/subleq-mesa/fig8_diversity.png)

the solution manifold is connected but vast. evolution samples from it approximately uniformly. there isn't *one* algorithm for modular addition in SUBLEQ - there are astronomically many, and evolution finds a different one every time. it's like how every copy of the hitchhiker's guide has the same information but arranged in a completely different, equally incomprehensible order.

## what doesn't help

two things that should've worked but didn't:

**curriculum evolution.** papailiopoulos used curriculum to train his interpreter - easy programs first, then harder ones. we tried the same: easy test cases first, then full. result: curriculum makes things *worse* (median 1,324 gens vs 608). the bottleneck isn't signal resolution, it's structural. the branch instruction is the hard part, and easy test cases don't test the branch. they just reward the addition head that's already frozen. don't panic, but also don't bother with curriculum here.

![curriculum hurts - staging easy-to-hard makes evolution slower, not faster](/blog/images/subleq-mesa/fig13_curriculum.png)

**gray code encoding.** SUBLEQ addresses are arbitrary. under standard binary, one bit flip can change address 3 to 35 (catastrophic jump). gray code ensures single-bit flips produce adjacent addresses. if discontinuities were syntactic, this should help. result: nearly identical damage curves, gray code actually *slower* (median 220 vs 91 gens). the discontinuities are semantic, not syntactic. the branch is all-or-nothing regardless of how you encode addresses. you can't towel your way out of mesa topology.

![gray code doesn't help - the discontinuities are semantic, not syntactic](/blog/images/subleq-mesa/fig16_encoding.png)

<figure class="meme">
<img src="/blog/images/subleq-mesa/surprised-pikachu.jpg" alt="surprised pikachu">
<figcaption>tried two theoretically sound approaches. both made things worse. :o</figcaption>
</figure>

## so long, and thanks for all the gradients

the core finding is simple: searchability depends on representation geometry, not computational expressiveness. SUBLEQ and transformers compute the same functions. but weight space creates wide basins where nearby parameters compute nearby functions, while program space creates mesas where nearby encodings compute unrelated functions.

the question isn't whether a representation is expressive enough. the question is whether it makes the right things *adjacent*.

papailiopoulos showed SGD finds interpreters. we showed the programs those interpreters run live on a razor's edge. the gap between these is the gap between learning *about* computation and learning *to* compute. transformers bridge it by embedding computation in a representation where search works. SUBLEQ's representation makes search impossible for the same computation.

don't panic. but maybe don't search program space either.

---

*all experiments reproducible. code and data at [github.com/Ja-Crispy/subleq](https://github.com/Ja-Crispy).*

*thanks to dimitris papailiopoulos and his group for the transformer-side evidence that makes the comparison possible. their [initial results](https://x.com/DimitrisPapail/status/2027089179381833858) and [full writeup](https://x.com/DimitrisPapail/status/2028669695344148946) are worth reading.*
