---
title: "fast LLM inference from scratch"
type: blog
url: https://andrewkchan.dev/posts/yalm.html
tags: [llm, cuda, performance, inference]
status: finished
date_added: 2026-01-12
---

building an LLM inference engine in C++ and CUDA from scratch, no libraries. progressive optimization from CPU multithreading through GPU kernels with memory coalescing and kernel fusion. hits ~64 tok/s on Mistral-7B, competitive with llama.cpp. andrew chan's site is the holy grail — every post is a masterclass.
